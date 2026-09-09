import type { PerspectiveCamera } from 'three';
import { Vector3 } from 'three';
import { FollowCamera } from '../camera/FollowCamera';
import { InputAction } from '../input/InputAction';
import type { InputManager } from '../input/InputManager';
import type { EventSequence } from '../events/EventTypes';
import type { WorldMapActions } from './WorldMapActions';
import type { WorldProgress } from './WorldProgress';
import type { WorldRoute } from './WorldRoute';
import { WorldMapRuntime } from './WorldMapRuntime';
import type { WorldMapVehicleOptions } from './WorldMapVehicle';

interface WorldMapControllerOptions {
  readonly interactionRadius: number;
  readonly vehicle: WorldMapVehicleOptions;
  readonly camera: {
    readonly offset: Readonly<Vector3>;
    readonly lookAtOffset: Readonly<Vector3>;
    readonly positionSharpness: number;
    readonly lookAtSharpness: number;
    readonly velocitySharpness: number;
    readonly lookAheadSeconds: number;
    readonly maxLookAhead: number;
    readonly teleportSnapDistance: number;
  };
}

interface WorldMapControllerDependencies {
  readonly input: InputManager;
  readonly route: WorldRoute;
  readonly progress: WorldProgress;
  readonly camera: PerspectiveCamera;
  readonly worldRoot: import('three').Object3D;
  readonly promptElement: HTMLElement;
  readonly hudElement: HTMLElement;
  readonly hudStatusElement: HTMLElement;
  readonly stageControlsElement: HTMLElement;
  readonly mapControlsElement: HTMLElement;
  readonly onActivate: () => void;
  readonly onDeactivate: () => void;
  readonly startEntrySequence: (sequence: EventSequence) => boolean;
}

export class WorldMapController implements WorldMapActions {
  private readonly runtime: WorldMapRuntime;
  private readonly followCamera: FollowCamera;
  private active = false;
  private showPending = false;
  private disposed = false;

  public constructor(
    private readonly dependencies: WorldMapControllerDependencies,
    private readonly options: WorldMapControllerOptions,
  ) {
    if (!Number.isFinite(options.interactionRadius) || options.interactionRadius <= 0) {
      throw new Error('World Map interaction radius must be a finite positive number.');
    }
    this.runtime = new WorldMapRuntime(
      dependencies.worldRoot,
      dependencies.route,
      options.vehicle,
    );
    this.followCamera = new FollowCamera(
      dependencies.camera,
      this.runtime.vehicle.object,
      options.camera,
    );
    dependencies.hudElement.hidden = true;
    dependencies.mapControlsElement.hidden = true;
  }

  public get isActive(): boolean {
    return this.active;
  }

  public get vehicleObject(): import('three').Object3D {
    return this.runtime.vehicle.object;
  }

  public showWorldMap(): void {
    if (!this.disposed) {
      this.showPending = true;
    }
  }

  public completeNodeAndShow(nodeId: string): void {
    if (this.disposed) {
      throw new Error('Cannot complete a World Map node after disposal.');
    }
    this.dependencies.progress.completeNode(nodeId);
    this.showPending = true;
  }

  public commitPendingTransition(): void {
    if (!this.showPending || this.disposed) {
      return;
    }
    this.showPending = false;
    this.activate();
  }

  public update(deltaSeconds: number): void {
    if (!this.active || this.disposed) {
      return;
    }
    this.runtime.vehicle.update(deltaSeconds, this.dependencies.input.getMovement());
    this.runtime.update(deltaSeconds);

    const available = this.dependencies.progress.availableNode;
    const vehiclePosition = this.runtime.vehicle.object.position;
    const inRange = available !== null && Math.hypot(
      vehiclePosition.x - available.position.x,
      vehiclePosition.z - available.position.z,
    ) <= this.options.interactionRadius;
    if (available !== null && inRange) {
      this.dependencies.promptElement.textContent = `E : Enter ${available.label}`;
      this.dependencies.promptElement.hidden = false;
    } else {
      this.dependencies.promptElement.hidden = true;
      this.dependencies.promptElement.textContent = '';
    }

    if (
      available !== null
      && inRange
      && this.dependencies.input.consumeActionPress(InputAction.Interact)
    ) {
      this.hide();
      if (!this.dependencies.startEntrySequence(available.entrySequence)) {
        this.showPending = true;
      }
    }
  }

  public updateCamera(deltaSeconds: number): void {
    if (this.active) {
      this.followCamera.update(deltaSeconds);
    }
  }

  public hide(): void {
    this.showPending = false;
    if (!this.active) {
      return;
    }
    this.active = false;
    this.runtime.setVisible(false);
    this.dependencies.promptElement.hidden = true;
    this.dependencies.promptElement.textContent = '';
    this.dependencies.hudElement.hidden = true;
    this.dependencies.mapControlsElement.hidden = true;
    this.dependencies.stageControlsElement.hidden = false;
    this.dependencies.onDeactivate();
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }
    this.hide();
    this.runtime.dispose();
    this.disposed = true;
  }

  private activate(): void {
    this.dependencies.onActivate();
    const spawn = this.dependencies.route.getVehicleSpawn(
      this.dependencies.progress.completedNodeIds,
    );
    this.runtime.vehicle.reset(spawn);
    this.runtime.updateNodeStates(this.dependencies.progress);
    this.runtime.setVisible(true);
    this.active = true;
    this.dependencies.stageControlsElement.hidden = true;
    this.dependencies.mapControlsElement.hidden = false;
    this.dependencies.hudElement.hidden = false;
    const available = this.dependencies.progress.availableNode;
    this.dependencies.hudStatusElement.textContent = available === null
      ? 'Route complete — 1-1 to 1-5'
      : `Next ${available.label} — ${available.stageLabel}`;
    this.followCamera.snapToTarget();
  }
}
