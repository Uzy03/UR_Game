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
import {
  THROW_RECEIVER_PRIORITY,
  type ThrowAssistContext,
  type ThrowReceiver,
  type ThrowReceiverCandidate,
  type ThrowReceiverReservation,
} from './ThrowReceiver';

export type ProcessingStationState = 'empty' | 'loaded' | 'processing' | 'processed';

interface ProcessingStationOptions {
  readonly id: string;
  readonly position: Readonly<Vector3Like>;
  readonly processingDurationSeconds: number;
  readonly acceptedItemIds: readonly string[];
  readonly parent: Object3D;
}

const PROGRESS_FILL_WIDTH = 0.74;

export class ProcessingStation implements Interactable, ThrowReceiver {
  public readonly id: string;
  public readonly object = new Group();
  private readonly pad: Mesh;
  private readonly itemAnchor = new Group();
  private readonly highlight: Mesh;
  private readonly progressRoot = new Group();
  private readonly progressFill: Mesh;
  private readonly acceptedItemIds: ReadonlySet<string>;
  private stationState: ProcessingStationState = 'empty';
  private loadedItem: PickableItem | null = null;
  private elapsedProcessingSeconds = 0;
  private processingEnabled = false;
  private reservedItem: PickableItem | null = null;
  private workElapsedSeconds = 0;

  public constructor(private readonly options: ProcessingStationOptions) {
    this.id = options.id;
    this.acceptedItemIds = new Set(options.acceptedItemIds);
    this.object.name = `ProcessingStation:${options.id}`;
    this.object.position.copy(options.position);

    this.pad = new Mesh(
      new BoxGeometry(1.15, 0.12, 0.9),
      new MeshStandardMaterial({ color: 0x628c7b, roughness: 0.68 }),
    );
    this.pad.position.y = 0.06;
    this.pad.castShadow = true;
    this.pad.receiveShadow = true;
    this.object.add(this.pad);

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
      this.resetVisual();
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
      return (
        this.reservedItem === null
        && carriedItem !== null
        && this.acceptedItemIds.has(carriedItem.id)
      );
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
    if (
      this.stationState === 'empty'
      && this.processingEnabled
      && this.reservedItem === null
    ) {
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
      this.loadedItem.triggerWorkComplete();
      this.stationState = 'processed';
      this.progressRoot.visible = false;
    }
  }

  public updateVisual(deltaSeconds: number): void {
    if (this.stationState !== 'processing' || this.loadedItem === null) {
      this.resetVisual();
      return;
    }
    const delta = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0;
    this.workElapsedSeconds += delta;
    const phase = this.workElapsedSeconds * 9;
    this.pad.position.y = 0.06 + Math.sin(phase) * 0.018;
    this.pad.rotation.z = Math.sin(phase * 0.5) * 0.012;
    this.loadedItem.object.position.set(
      Math.sin(phase * 1.7) * 0.045,
      Math.abs(Math.sin(phase)) * 0.025,
      Math.cos(phase * 1.3) * 0.025,
    );
    this.loadedItem.object.rotation.set(0, Math.sin(phase) * 0.08, Math.sin(phase * 1.7) * 0.05);
  }

  public getThrowReceiverCandidate(
    item: PickableItem,
    context: ThrowAssistContext,
  ): ThrowReceiverCandidate | null {
    if (
      !this.processingEnabled
      || this.stationState !== 'empty'
      || this.reservedItem !== null
      || !this.acceptedItemIds.has(item.id)
      || !item.isActive
    ) {
      return null;
    }
    const targetPosition = this.itemAnchor.getWorldPosition(new Vector3());
    context.worldRoot.worldToLocal(targetPosition);
    return {
      id: `processing-station:${this.id}`,
      priority: THROW_RECEIVER_PRIORITY.station,
      assistRadius: Number.POSITIVE_INFINITY,
      targetPosition,
      reserve: () => this.reserveThrow(item, targetPosition),
    };
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
    this.resetVisual();
    this.loadedItem = null;
    this.reservedItem = null;
    this.stationState = 'empty';
    this.elapsedProcessingSeconds = 0;
    this.processingEnabled = false;
    this.setHighlighted(false);
    this.progressRoot.visible = false;
    this.updateProgressVisual(0);
  }

  private reserveThrow(
    item: PickableItem,
    targetPosition: Readonly<Vector3>,
  ): ThrowReceiverReservation | null {
    if (
      !this.processingEnabled
      || this.stationState !== 'empty'
      || this.reservedItem !== null
      || !this.acceptedItemIds.has(item.id)
    ) {
      return null;
    }
    this.reservedItem = item;
    let active = true;
    const release = (): void => {
      if (active && this.reservedItem === item) {
        this.reservedItem = null;
      }
      active = false;
    };
    return {
      targetPosition: targetPosition.clone(),
      complete: (landedItem) => {
        release();
        this.loadedItem = landedItem;
        landedItem.placeAt(this.itemAnchor);
        this.stationState = landedItem.isProcessed ? 'processed' : 'loaded';
        return null;
      },
      cancel: release,
    };
  }

  public resetVisual(): void {
    this.workElapsedSeconds = 0;
    this.pad.position.y = 0.06;
    this.pad.rotation.set(0, 0, 0);
    if (this.loadedItem !== null) {
      this.loadedItem.object.position.set(0, 0, 0);
      this.loadedItem.object.rotation.set(0, 0, 0);
    }
  }

  private updateProgressVisual(progress: number): void {
    this.progressFill.scale.x = progress;
    this.progressFill.position.x = (progress - 1) * PROGRESS_FILL_WIDTH / 2;
  }
}
