import { Vector3, type Object3D, type Vector3Like } from 'three';
import { InputAction } from '../input/InputAction';
import type { InputManager } from '../input/InputManager';
import { resolvePlanarActionDirection } from '../player/PlanarActionDirection';
import type { PlayerController } from '../player/PlayerController';
import type { CarrySystem, FloorDropValidator } from './CarrySystem';
import type { PickableItem } from './PickableItem';

export interface ItemThrowSystemOptions {
  readonly distance: number;
  readonly durationSeconds: number;
  readonly arcHeight: number;
  readonly minimumLandingDistance: number;
  readonly landingSearchStep: number;
  readonly inputDirectionThreshold: number;
  readonly landingSpacing: number;
}

interface ThrowSceneBinding {
  readonly worldRoot: Object3D;
  readonly allItems: readonly PickableItem[];
  readonly floorDropValidator: FloorDropValidator;
}

interface ActiveItemThrow {
  readonly item: PickableItem;
  readonly worldRoot: Object3D;
  readonly startPosition: Vector3;
  readonly landingPosition: Vector3;
  elapsedSeconds: number;
}

interface LandingSearchOptions {
  readonly maximumDistance: number;
  readonly minimumDistance: number;
  readonly step: number;
}

type LandingValidator = (position: Readonly<Vector3Like>) => boolean;

export function findFarthestValidLandingPosition(
  origin: Readonly<Vector3Like>,
  direction: Readonly<Vector3Like>,
  options: LandingSearchOptions,
  isValid: LandingValidator,
): Vector3 | null {
  const directionLength = Math.hypot(direction.x, direction.z);
  if (!Number.isFinite(directionLength) || directionLength <= Number.EPSILON) {
    return null;
  }

  const maximumDistance = Math.max(0, options.maximumDistance);
  const minimumDistance = Math.min(maximumDistance, Math.max(0, options.minimumDistance));
  const step = Number.isFinite(options.step) && options.step > 0 ? options.step : maximumDistance;
  if (!Number.isFinite(maximumDistance) || maximumDistance <= 0 || step <= 0) {
    return null;
  }

  const normalizedX = direction.x / directionLength;
  const normalizedZ = direction.z / directionLength;
  const candidate = new Vector3();
  const attempt = (distance: number): Vector3 | null => {
    candidate.set(
      origin.x + normalizedX * distance,
      0,
      origin.z + normalizedZ * distance,
    );
    return isValid(candidate) ? candidate.clone() : null;
  };

  let distance = maximumDistance;
  while (distance >= minimumDistance) {
    const validCandidate = attempt(distance);
    if (validCandidate !== null) {
      return validCandidate;
    }
    distance -= step;
  }

  if (distance + step > minimumDistance) {
    return attempt(minimumDistance);
  }
  return null;
}

export class ItemThrowSystem {
  private readonly activeThrows = new Map<PickableItem, ActiveItemThrow>();
  private readonly playerWorldPosition = new Vector3();
  private readonly playerLocalPosition = new Vector3();
  private readonly directionEnd = new Vector3();
  private readonly localDirection = new Vector3();
  private sceneBinding: ThrowSceneBinding | null = null;
  private disposed = false;

  public constructor(
    private readonly input: InputManager,
    private readonly player: PlayerController,
    private readonly carry: CarrySystem,
    private readonly options: ItemThrowSystemOptions,
  ) {
    const positiveValues = [
      options.distance,
      options.durationSeconds,
      options.minimumLandingDistance,
      options.landingSearchStep,
    ];
    if (positiveValues.some((value) => !Number.isFinite(value) || value <= 0)) {
      throw new Error('Throw distance, duration, minimum distance, and search step must be positive.');
    }
    if (options.minimumLandingDistance > options.distance) {
      throw new Error('Throw minimum landing distance cannot exceed maximum distance.');
    }
    if (
      !Number.isFinite(options.arcHeight)
      || options.arcHeight < 0
      || !Number.isFinite(options.inputDirectionThreshold)
      || options.inputDirectionThreshold < 0
      || !Number.isFinite(options.landingSpacing)
      || options.landingSpacing < 0
    ) {
      throw new Error('Throw arc height, direction threshold, and spacing must be non-negative.');
    }
  }

  public get activeThrowCount(): number {
    return this.activeThrows.size;
  }

  public bindScene(
    worldRoot: Object3D,
    allItems: readonly PickableItem[],
    floorDropValidator: FloorDropValidator,
  ): void {
    this.unbindScene();
    this.sceneBinding = { worldRoot, allItems, floorDropValidator };
  }

  public unbindScene(): void {
    this.cancelAll();
    this.sceneBinding = null;
  }

  public update(deltaSeconds: number): void {
    if (this.disposed) {
      return;
    }

    const requested = this.input.consumeActionPress(InputAction.Throw);
    if (requested && this.player.isMovementEnabled) {
      this.tryStartThrow();
    }

    const delta = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0;
    for (const [item, trajectory] of this.activeThrows) {
      if (!item.isThrown || !item.isActive) {
        this.activeThrows.delete(item);
        continue;
      }

      trajectory.elapsedSeconds = Math.min(
        this.options.durationSeconds,
        trajectory.elapsedSeconds + delta,
      );
      const progress = trajectory.elapsedSeconds / this.options.durationSeconds;
      item.object.position.lerpVectors(
        trajectory.startPosition,
        trajectory.landingPosition,
        progress,
      );
      item.object.position.y += 4 * this.options.arcHeight * progress * (1 - progress);

      if (progress >= 1) {
        item.placeOnFloor(trajectory.worldRoot, trajectory.landingPosition);
        this.activeThrows.delete(item);
      }
    }
  }

  public cancelAll(): void {
    for (const trajectory of this.activeThrows.values()) {
      if (trajectory.item.isThrown && trajectory.item.isActive) {
        trajectory.item.placeOnFloor(trajectory.worldRoot, trajectory.landingPosition);
      }
    }
    this.activeThrows.clear();
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }
    this.unbindScene();
    this.disposed = true;
  }

  private tryStartThrow(): boolean {
    const binding = this.sceneBinding;
    const item = this.carry.item;
    if (binding === null || item === null || !item.isActive) {
      return false;
    }

    const movement = this.input.getMovement();
    const worldDirection = resolvePlanarActionDirection(
      { x: movement.x, z: movement.y },
      this.player.object.rotation.y,
      this.options.inputDirectionThreshold,
    );
    this.player.object.getWorldPosition(this.playerWorldPosition);
    this.playerLocalPosition.copy(this.playerWorldPosition);
    binding.worldRoot.worldToLocal(this.playerLocalPosition);
    this.directionEnd.copy(this.playerWorldPosition);
    this.directionEnd.x += worldDirection.x;
    this.directionEnd.z += worldDirection.z;
    binding.worldRoot.worldToLocal(this.directionEnd);
    this.localDirection.subVectors(this.directionEnd, this.playerLocalPosition);
    this.localDirection.y = 0;

    const landingPosition = findFarthestValidLandingPosition(
      this.playerLocalPosition,
      this.localDirection,
      {
        maximumDistance: this.options.distance,
        minimumDistance: this.options.minimumLandingDistance,
        step: this.options.landingSearchStep,
      },
      (candidate) => (
        binding.floorDropValidator(candidate, item, binding.allItems)
        && this.isLandingReservationFree(candidate, item)
      ),
    );
    if (landingPosition === null || !this.carry.releaseForThrow(item, binding.worldRoot)) {
      return false;
    }

    this.activeThrows.set(item, {
      item,
      worldRoot: binding.worldRoot,
      startPosition: item.object.position.clone(),
      landingPosition,
      elapsedSeconds: 0,
    });
    this.player.triggerThrow();
    return true;
  }

  private isLandingReservationFree(
    candidate: Readonly<Vector3Like>,
    item: PickableItem,
  ): boolean {
    for (const trajectory of this.activeThrows.values()) {
      const minimumDistance = (
        item.footprintRadius
        + trajectory.item.footprintRadius
        + this.options.landingSpacing
      );
      const distanceSquared = (
        (candidate.x - trajectory.landingPosition.x) ** 2
        + (candidate.z - trajectory.landingPosition.z) ** 2
      );
      if (distanceSquared < minimumDistance ** 2) {
        return false;
      }
    }
    return true;
  }
}
