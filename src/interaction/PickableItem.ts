import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  RingGeometry,
  SphereGeometry,
  type Vector3Like,
  Vector3,
} from 'three';
import type { Interactable, InteractionContext } from './Interactable';
import { InteractionHighlight } from '../visual/InteractionHighlight';

export type PickableItemKind = 'tomato' | 'box' | 'plate' | 'drink' | 'bundle';
export type ItemProcessingState = 'raw' | 'processed';
export type PickableItemPlacementState = 'world' | 'carried' | 'placed';

export interface PickableItemRuntimeState {
  readonly parent: Object3D;
  readonly position: Vector3;
  readonly quaternion: Quaternion;
  readonly placementState: PickableItemPlacementState;
  readonly processingState: ItemProcessingState;
  readonly active: boolean;
}

interface PickableItemOptions {
  readonly id: string;
  readonly kind: PickableItemKind;
  readonly position: Readonly<Vector3Like>;
  readonly parent: Object3D;
  readonly initialProcessingState?: ItemProcessingState;
  readonly initialActive?: boolean;
}

const ITEM_FOOTPRINT_RADIUS: Record<PickableItemKind, number> = {
  tomato: 0.23,
  box: 0.3,
  plate: 0.32,
  drink: 0.24,
  bundle: 0.32,
};

export class PickableItem implements Interactable {
  public readonly id: string;
  public readonly object = new Group();
  public readonly footprintRadius: number;
  private readonly visual: Group;
  private readonly highlight: InteractionHighlight;
  private readonly processedIndicator: Mesh;
  private readonly initialParent: Object3D;
  private readonly initialPosition = new Vector3();
  private readonly initialRotation = new Vector3();
  private readonly initialProcessingState: ItemProcessingState;
  private readonly initialActive: boolean;
  private state: PickableItemPlacementState = 'world';
  private itemProcessingState: ItemProcessingState = 'raw';
  private active = true;
  private feedbackKind: 'none' | 'pickup' | 'settle' = 'none';
  private feedbackElapsedSeconds = 0;

  public constructor(options: PickableItemOptions) {
    this.id = options.id;
    this.initialParent = options.parent;
    this.initialPosition.copy(options.position);
    this.initialProcessingState = options.initialProcessingState ?? 'raw';
    this.initialActive = options.initialActive ?? true;
    this.object.name = `PickableItem:${options.id}`;
    this.footprintRadius = ITEM_FOOTPRINT_RADIUS[options.kind];
    this.visual = this.createVisual(options.kind);
    this.object.add(this.visual);

    const highlightMesh = new Mesh(
      new RingGeometry(this.footprintRadius + 0.04, this.footprintRadius + 0.12, 32),
      new MeshBasicMaterial({
        color: 0xf3d58a,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    highlightMesh.name = 'InteractionHighlight';
    highlightMesh.rotation.x = -Math.PI / 2;
    highlightMesh.position.y = 0.012;
    this.object.add(highlightMesh);
    this.highlight = new InteractionHighlight(highlightMesh, 0.82);

    this.processedIndicator = new Mesh(
      new SphereGeometry(0.095, 14, 10),
      new MeshStandardMaterial({
        color: 0x68d391,
        emissive: 0x184f2d,
        roughness: 0.45,
      }),
    );
    this.processedIndicator.name = 'ProcessedIndicator';
    this.processedIndicator.position.set(0.2, 0.56, 0);
    this.processedIndicator.visible = false;
    this.processedIndicator.castShadow = true;
    this.object.add(this.processedIndicator);

    if (this.initialProcessingState === 'processed') {
      this.markProcessed();
    }

    options.parent.add(this.object);
    this.object.position.copy(options.position);
    this.initialRotation.set(
      this.object.rotation.x,
      this.object.rotation.y,
      this.object.rotation.z,
    );
    this.resetActiveState();
  }

  public canInteract(context: InteractionContext): boolean {
    return this.active && this.state === 'world' && !context.carry.hasItem;
  }

  public getInteractionLabel(_context: InteractionContext): string {
    return 'Pick up';
  }

  public interact(context: InteractionContext): boolean {
    return context.carry.pickUp(this);
  }

  public getInteractionPosition(target: Vector3): Vector3 {
    this.object.getWorldPosition(target);
    target.y += 0.2;
    return target;
  }

  public setHighlighted(highlighted: boolean): void {
    this.highlight.setActive(highlighted);
  }

  public updateVisual(deltaSeconds: number): void {
    this.highlight.update(deltaSeconds);
    if (this.feedbackKind === 'none') {
      return;
    }

    const duration = this.feedbackKind === 'pickup' ? 0.2 : 0.28;
    this.feedbackElapsedSeconds += Math.max(0, deltaSeconds);
    const progress = Math.min(1, this.feedbackElapsedSeconds / duration);
    if (this.feedbackKind === 'pickup') {
      const pop = Math.sin(progress * Math.PI);
      this.visual.position.y = pop * 0.16;
      this.visual.scale.setScalar(1 + pop * 0.13);
    } else {
      const settle = Math.sin(progress * Math.PI * 2.5) * (1 - progress);
      this.visual.position.y = Math.max(0, settle * 0.08);
      this.visual.scale.set(1 + settle * 0.06, 1 - settle * 0.04, 1 + settle * 0.06);
    }

    if (progress >= 1) {
      this.resetVisualFeedback();
    }
  }

  public isOnFloor(): boolean {
    return this.active && this.state === 'world';
  }

  public get isActive(): boolean {
    return this.active;
  }

  public get processingState(): ItemProcessingState {
    return this.itemProcessingState;
  }

  public get isProcessed(): boolean {
    return this.itemProcessingState === 'processed';
  }

  public markProcessed(): void {
    this.setProcessingState('processed');
  }

  public activateAt(anchor: Object3D): void {
    this.setActive(true);
    this.placeAt(anchor);
  }

  public deactivate(): void {
    this.setActive(false);
  }

  public carryBy(anchor: Object3D): void {
    this.state = 'carried';
    this.setHighlighted(false);
    anchor.add(this.object);
    this.object.position.set(0, 0, 0);
    this.object.rotation.set(0, 0, 0);
    this.startVisualFeedback('pickup');
  }

  public placeAt(anchor: Object3D): void {
    this.state = 'placed';
    this.setHighlighted(false);
    anchor.add(this.object);
    this.object.position.set(0, 0, 0);
    this.object.rotation.set(0, 0, 0);
    this.startVisualFeedback('settle');
  }

  public placeOnFloor(parent: Object3D, position: Readonly<Vector3Like>): void {
    this.state = 'world';
    this.setHighlighted(false);
    parent.add(this.object);
    this.object.position.copy(position);
    this.object.rotation.set(0, 0, 0);
    this.startVisualFeedback('settle');
  }

  public reset(): void {
    this.resetTransform();
    this.resetProcessingState();
    this.resetActiveState();
  }

  public resetTransform(): void {
    this.state = 'world';
    this.setHighlighted(false);
    this.initialParent.add(this.object);
    this.object.position.copy(this.initialPosition);
    this.object.rotation.set(
      this.initialRotation.x,
      this.initialRotation.y,
      this.initialRotation.z,
    );
    this.resetVisualFeedback();
  }

  public resetProcessingState(): void {
    this.setProcessingState(this.initialProcessingState);
  }

  public resetActiveState(): void {
    this.setActive(this.initialActive);
  }

  public captureRuntimeState(): PickableItemRuntimeState {
    const parent = this.object.parent;
    if (parent === null) {
      throw new Error(`PickableItem "${this.id}" has no parent to capture.`);
    }

    return {
      parent,
      position: this.object.position.clone(),
      quaternion: this.object.quaternion.clone(),
      placementState: this.state,
      processingState: this.itemProcessingState,
      active: this.active,
    };
  }

  public restoreRuntimeState(runtimeState: PickableItemRuntimeState): void {
    this.setHighlighted(false);
    runtimeState.parent.add(this.object);
    this.object.position.copy(runtimeState.position);
    this.object.quaternion.copy(runtimeState.quaternion);
    this.state = runtimeState.placementState;
    this.setProcessingState(runtimeState.processingState);
    this.setActive(runtimeState.active);
    this.resetVisualFeedback();
  }

  public releaseToWorld(parent: Object3D): void {
    parent.attach(this.object);
    this.state = 'world';
    this.setHighlighted(false);
  }

  private setProcessingState(state: ItemProcessingState): void {
    this.itemProcessingState = state;
    this.processedIndicator.visible = state === 'processed';
  }

  private setActive(active: boolean): void {
    this.active = active;
    this.object.visible = active;
    if (!active) {
      this.setHighlighted(false);
    }
  }

  private startVisualFeedback(kind: 'pickup' | 'settle'): void {
    this.feedbackKind = kind;
    this.feedbackElapsedSeconds = 0;
  }

  private resetVisualFeedback(): void {
    this.feedbackKind = 'none';
    this.feedbackElapsedSeconds = 0;
    this.visual.position.set(0, 0, 0);
    this.visual.scale.set(1, 1, 1);
  }

  private createVisual(kind: PickableItemKind): Group {
    const visual = new Group();

    if (kind === 'tomato') {
      const body = new Mesh(
        new SphereGeometry(0.23, 18, 14),
        new MeshStandardMaterial({ color: 0xe9514f, roughness: 0.72 }),
      );
      body.position.y = 0.23;
      visual.add(body);

      const leaves = new Mesh(
        new CylinderGeometry(0.04, 0.12, 0.045, 6),
        new MeshStandardMaterial({ color: 0x4f9b62, roughness: 0.8 }),
      );
      leaves.position.y = 0.45;
      visual.add(leaves);
    } else if (kind === 'box') {
      const box = new Mesh(
        new BoxGeometry(0.46, 0.38, 0.46),
        new MeshStandardMaterial({ color: 0xe4aa52, roughness: 0.82 }),
      );
      box.position.y = 0.19;
      visual.add(box);
    } else if (kind === 'plate') {
      const plate = new Mesh(
        new CylinderGeometry(0.3, 0.25, 0.075, 24),
        new MeshStandardMaterial({ color: 0xf5f1df, roughness: 0.55 }),
      );
      plate.position.y = 0.04;
      visual.add(plate);
    } else if (kind === 'drink') {
      const cup = new Mesh(
        new CylinderGeometry(0.17, 0.14, 0.34, 18),
        new MeshStandardMaterial({ color: 0xc97b58, roughness: 0.62 }),
      );
      cup.position.y = 0.17;
      const lid = new Mesh(
        new CylinderGeometry(0.19, 0.19, 0.045, 18),
        new MeshStandardMaterial({ color: 0xf5ead9, roughness: 0.5 }),
      );
      lid.position.y = 0.36;
      visual.add(cup, lid);
    } else {
      const bundle = new Mesh(
        new BoxGeometry(0.54, 0.34, 0.42),
        new MeshStandardMaterial({ color: 0x7fa6c9, roughness: 0.68 }),
      );
      bundle.position.y = 0.17;
      const ribbon = new Mesh(
        new BoxGeometry(0.12, 0.37, 0.44),
        new MeshStandardMaterial({ color: 0xf1cf72, roughness: 0.55 }),
      );
      ribbon.position.y = 0.18;
      visual.add(bundle, ribbon);
    }

    visual.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    return visual;
  }
}
