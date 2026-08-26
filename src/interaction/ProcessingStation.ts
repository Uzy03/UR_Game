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

export type ProcessingStationState = 'empty' | 'loaded' | 'processing' | 'processed';

interface ProcessingStationOptions {
  readonly id: string;
  readonly position: Readonly<Vector3Like>;
  readonly processingDurationSeconds: number;
  readonly acceptedItemIds: readonly string[];
  readonly parent: Object3D;
}

const PROGRESS_FILL_WIDTH = 0.74;

export class ProcessingStation implements Interactable {
  public readonly id: string;
  public readonly object = new Group();
  private readonly itemAnchor = new Group();
  private readonly highlight: Mesh;
  private readonly progressRoot = new Group();
  private readonly progressFill: Mesh;
  private readonly acceptedItemIds: ReadonlySet<string>;
  private stationState: ProcessingStationState = 'empty';
  private loadedItem: PickableItem | null = null;
  private elapsedProcessingSeconds = 0;
  private processingEnabled = false;

  public constructor(private readonly options: ProcessingStationOptions) {
    this.id = options.id;
    this.acceptedItemIds = new Set(options.acceptedItemIds);
    this.object.name = `ProcessingStation:${options.id}`;
    this.object.position.copy(options.position);

    const pad = new Mesh(
      new BoxGeometry(1.15, 0.12, 0.9),
      new MeshStandardMaterial({ color: 0x628c7b, roughness: 0.68 }),
    );
    pad.position.y = 0.06;
    pad.castShadow = true;
    pad.receiveShadow = true;
    this.object.add(pad);

    this.itemAnchor.name = 'ProcessingItemAnchor';
    this.itemAnchor.position.y = 0.13;
    this.object.add(this.itemAnchor);

    this.highlight = new Mesh(
      new RingGeometry(0.56, 0.68, 36),
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
      new BoxGeometry(0.82, 0.05, 0.16),
      new MeshBasicMaterial({ color: 0x263a35 }),
    );
    this.progressRoot.add(progressBackground);
    this.progressFill = new Mesh(
      new BoxGeometry(PROGRESS_FILL_WIDTH, 0.065, 0.1),
      new MeshBasicMaterial({ color: 0x82e0a7 }),
    );
    this.progressRoot.add(this.progressFill);
    this.progressRoot.position.set(0, 0.72, 0);
    this.progressRoot.visible = false;
    this.object.add(this.progressRoot);
    this.updateProgressVisual(0);

    options.parent.add(this.object);
  }

  public get state(): ProcessingStationState {
    return this.stationState;
  }

  public get currentItem(): PickableItem | null {
    return this.loadedItem;
  }

  public get processingProgress(): number {
    return Math.min(1, this.elapsedProcessingSeconds / this.options.processingDurationSeconds);
  }

  public setProcessingEnabled(enabled: boolean): void {
    this.processingEnabled = enabled;
    if (!enabled && this.stationState === 'processing') {
      this.stationState = 'loaded';
      this.elapsedProcessingSeconds = 0;
      this.progressRoot.visible = false;
      this.updateProgressVisual(0);
    }
  }

  public canInteract(context: InteractionContext): boolean {
    if (this.stationState === 'processed') {
      return !context.carry.hasItem;
    }
    if (!this.processingEnabled) {
      return false;
    }
    if (this.stationState === 'empty') {
      const carriedItem = context.carry.item;
      return carriedItem !== null && this.acceptedItemIds.has(carriedItem.id);
    }
    return this.stationState === 'loaded' && !context.carry.hasItem;
  }

  public getInteractionLabel(_context: InteractionContext): string {
    if (this.stationState === 'empty') {
      return 'Place';
    }
    if (this.stationState === 'loaded') {
      return 'Process';
    }
    return 'Pick up';
  }

  public interact(context: InteractionContext): boolean {
    if (this.stationState === 'empty' && this.processingEnabled) {
      const carriedItem = context.carry.item;
      if (carriedItem === null || !this.acceptedItemIds.has(carriedItem.id)) {
        return false;
      }
      const item = context.carry.releaseForPlacement();
      if (item === null) {
        return false;
      }
      this.loadedItem = item;
      item.placeAt(this.itemAnchor);
      this.stationState = item.isProcessed ? 'processed' : 'loaded';
      return true;
    }

    if (this.stationState === 'loaded' && this.processingEnabled) {
      this.stationState = 'processing';
      this.elapsedProcessingSeconds = 0;
      this.updateProgressVisual(0);
      this.progressRoot.visible = true;
      return true;
    }

    if (this.stationState === 'processed' && this.loadedItem !== null) {
      const item = this.loadedItem;
      if (!context.carry.pickUp(item)) {
        return false;
      }
      this.loadedItem = null;
      this.stationState = 'empty';
      this.elapsedProcessingSeconds = 0;
      this.progressRoot.visible = false;
      this.updateProgressVisual(0);
      return true;
    }

    return false;
  }

  public update(deltaSeconds: number): void {
    if (this.stationState !== 'processing' || this.loadedItem === null) {
      return;
    }

    const safeDeltaSeconds = Number.isFinite(deltaSeconds) && deltaSeconds > 0
      ? deltaSeconds
      : 0;
    this.elapsedProcessingSeconds = Math.min(
      this.options.processingDurationSeconds,
      this.elapsedProcessingSeconds + safeDeltaSeconds,
    );
    this.updateProgressVisual(this.processingProgress);

    if (this.elapsedProcessingSeconds >= this.options.processingDurationSeconds) {
      this.loadedItem.markProcessed();
      this.stationState = 'processed';
      this.progressRoot.visible = false;
    }
  }

  public getInteractionPosition(target: Vector3): Vector3 {
    this.object.getWorldPosition(target);
    target.y += 0.35;
    return target;
  }

  public setHighlighted(highlighted: boolean): void {
    this.highlight.visible = highlighted;
  }

  public reset(): void {
    this.loadedItem = null;
    this.stationState = 'empty';
    this.elapsedProcessingSeconds = 0;
    this.processingEnabled = false;
    this.setHighlighted(false);
    this.progressRoot.visible = false;
    this.updateProgressVisual(0);
  }

  private updateProgressVisual(progress: number): void {
    this.progressFill.scale.x = progress;
    this.progressFill.position.x = (progress - 1) * PROGRESS_FILL_WIDTH / 2;
  }
}
