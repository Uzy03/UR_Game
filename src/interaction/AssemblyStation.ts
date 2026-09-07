import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RingGeometry,
  type Object3D,
  type Vector3Like,
  Vector3,
} from 'three';
import type { Interactable, InteractionContext } from './Interactable';
import type { PickableItem } from './PickableItem';

export type AssemblyStationState =
  | 'empty'
  | 'one-loaded'
  | 'ready'
  | 'combining'
  | 'completed'
  | 'output-collected';

interface AssemblyStationOptions {
  readonly id: string;
  readonly position: Readonly<Vector3Like>;
  readonly inputItems: readonly [PickableItem, PickableItem];
  readonly outputItem: PickableItem;
  readonly combineDurationSeconds: number;
  readonly parent: Object3D;
}

const PROGRESS_FILL_WIDTH = 0.82;

export class AssemblyStation implements Interactable {
  public readonly id: string;
  public readonly object = new Group();
  private readonly inputAnchorA = new Group();
  private readonly inputAnchorB = new Group();
  private readonly outputAnchor = new Group();
  private readonly highlight: Mesh;
  private readonly progressRoot = new Group();
  private readonly progressFill: Mesh;
  private readonly inputsById: ReadonlyMap<string, PickableItem>;
  private stationState: AssemblyStationState = 'empty';
  private loadedInputA: PickableItem | null = null;
  private loadedInputB: PickableItem | null = null;
  private elapsedCombineSeconds = 0;
  private assemblyEnabled = false;

  public constructor(private readonly options: AssemblyStationOptions) {
    this.id = options.id;
    this.inputsById = new Map(options.inputItems.map((item) => [item.id, item] as const));
    this.object.name = `AssemblyStation:${options.id}`;
    this.object.position.copy(options.position);

    const pad = new Mesh(
      new BoxGeometry(1.5, 0.12, 0.95),
      new MeshStandardMaterial({ color: 0x6f7fa7, roughness: 0.64 }),
    );
    pad.position.y = 0.06;
    pad.castShadow = true;
    pad.receiveShadow = true;
    this.object.add(pad);

    this.inputAnchorA.name = 'AssemblyInputAnchorA';
    this.inputAnchorA.position.set(-0.38, 0.13, 0);
    this.inputAnchorB.name = 'AssemblyInputAnchorB';
    this.inputAnchorB.position.set(0.38, 0.13, 0);
    this.outputAnchor.name = 'AssemblyOutputAnchor';
    this.outputAnchor.position.set(0, 0.13, 0);
    this.object.add(this.inputAnchorA, this.inputAnchorB, this.outputAnchor);

    this.highlight = new Mesh(
      new RingGeometry(0.7, 0.82, 40),
      new MeshBasicMaterial({
        color: 0xffef8a,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      }),
    );
    this.highlight.rotation.x = -Math.PI / 2;
    this.highlight.position.y = 0.015;
    this.highlight.visible = false;
    this.object.add(this.highlight);

    const progressBackground = new Mesh(
      new BoxGeometry(0.9, 0.05, 0.16),
      new MeshBasicMaterial({ color: 0x283044 }),
    );
    this.progressRoot.add(progressBackground);
    this.progressFill = new Mesh(
      new BoxGeometry(PROGRESS_FILL_WIDTH, 0.065, 0.1),
      new MeshBasicMaterial({ color: 0x9fb8ff }),
    );
    this.progressRoot.add(this.progressFill);
    this.progressRoot.position.set(0, 0.78, 0);
    this.progressRoot.visible = false;
    this.object.add(this.progressRoot);
    this.updateProgressVisual(0);

    options.parent.add(this.object);
  }

  public get state(): AssemblyStationState {
    return this.stationState;
  }

  public get hasCompletedAssembly(): boolean {
    return this.stationState === 'completed' || this.stationState === 'output-collected';
  }

  public get combineProgress(): number {
    return Math.min(1, this.elapsedCombineSeconds / this.options.combineDurationSeconds);
  }

  public setAssemblyEnabled(enabled: boolean): void {
    this.assemblyEnabled = enabled;
    if (!enabled && this.stationState === 'combining') {
      this.stationState = 'ready';
      this.elapsedCombineSeconds = 0;
      this.progressRoot.visible = false;
      this.updateProgressVisual(0);
    }
  }

  public canInteract(context: InteractionContext): boolean {
    if (this.stationState === 'completed') {
      return !context.carry.hasItem && this.options.outputItem.isActive;
    }
    if (!this.assemblyEnabled) {
      return false;
    }
    if (context.carry.hasItem) {
      const carriedItem = context.carry.item;
      return carriedItem !== null && this.getAvailableSlot(carriedItem) !== null;
    }
    return this.stationState === 'ready';
  }

  public getInteractionLabel(context: InteractionContext): string {
    if (this.stationState === 'completed') {
      return 'Pick up';
    }
    return context.carry.hasItem ? 'Place' : 'Combine';
  }

  public interact(context: InteractionContext): boolean {
    if (this.stationState === 'completed' && !context.carry.hasItem) {
      if (!context.carry.pickUp(this.options.outputItem)) {
        return false;
      }
      this.stationState = 'output-collected';
      return true;
    }

    if (!this.assemblyEnabled) {
      return false;
    }

    if (context.carry.hasItem) {
      const carriedItem = context.carry.item;
      if (carriedItem === null) {
        return false;
      }
      const slot = this.getAvailableSlot(carriedItem);
      if (slot === null) {
        return false;
      }
      const releasedItem = context.carry.releaseForPlacement();
      if (releasedItem === null) {
        return false;
      }
      if (slot === 'a') {
        this.loadedInputA = releasedItem;
        releasedItem.placeAt(this.inputAnchorA);
      } else {
        this.loadedInputB = releasedItem;
        releasedItem.placeAt(this.inputAnchorB);
      }
      this.stationState = this.loadedInputA !== null && this.loadedInputB !== null
        ? 'ready'
        : 'one-loaded';
      return true;
    }

    if (this.stationState === 'ready') {
      this.stationState = 'combining';
      this.elapsedCombineSeconds = 0;
      this.updateProgressVisual(0);
      this.progressRoot.visible = true;
      return true;
    }

    return false;
  }

  public update(deltaSeconds: number): void {
    if (
      this.stationState !== 'combining'
      || this.loadedInputA === null
      || this.loadedInputB === null
    ) {
      return;
    }

    const safeDeltaSeconds = Number.isFinite(deltaSeconds) && deltaSeconds > 0
      ? deltaSeconds
      : 0;
    this.elapsedCombineSeconds = Math.min(
      this.options.combineDurationSeconds,
      this.elapsedCombineSeconds + safeDeltaSeconds,
    );
    this.updateProgressVisual(this.combineProgress);

    if (this.elapsedCombineSeconds >= this.options.combineDurationSeconds) {
      this.loadedInputA.deactivate();
      this.loadedInputB.deactivate();
      this.loadedInputA = null;
      this.loadedInputB = null;
      this.options.outputItem.activateAt(this.outputAnchor);
      this.stationState = 'completed';
      this.progressRoot.visible = false;
    }
  }

  public getInteractionPosition(target: Vector3): Vector3 {
    this.object.getWorldPosition(target);
    target.y += 0.4;
    return target;
  }

  public setHighlighted(highlighted: boolean): void {
    this.highlight.visible = highlighted;
  }

  public reset(): void {
    this.loadedInputA = null;
    this.loadedInputB = null;
    this.stationState = 'empty';
    this.elapsedCombineSeconds = 0;
    this.assemblyEnabled = false;
    this.setHighlighted(false);
    this.progressRoot.visible = false;
    this.updateProgressVisual(0);
  }

  private getAvailableSlot(item: PickableItem): 'a' | 'b' | null {
    if (!this.inputsById.has(item.id)) {
      return null;
    }
    if (item === this.options.inputItems[0] && this.loadedInputA === null) {
      return 'a';
    }
    if (item === this.options.inputItems[1] && this.loadedInputB === null) {
      return 'b';
    }
    return null;
  }

  private updateProgressVisual(progress: number): void {
    this.progressFill.scale.x = progress;
    this.progressFill.position.x = (progress - 1) * PROGRESS_FILL_WIDTH / 2;
  }
}
