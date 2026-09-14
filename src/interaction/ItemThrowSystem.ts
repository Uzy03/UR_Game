import { Vector3, type Object3D, type Vector3Like } from 'three';
import { InputAction } from '../input/InputAction';
import type { InputManager } from '../input/InputManager';
import { resolvePlanarActionDirection } from '../player/PlanarActionDirection';
import type { PlayerController } from '../player/PlayerController';
import type { CarrySystem, FloorDropValidator } from './CarrySystem';
import type { PickableItem } from './PickableItem';
import type {
  ThrowAssistContext,
  ThrowReceiveTransition,
  ThrowReceiver,
  ThrowReceiverCandidate,
  ThrowReceiverReservation,
} from './ThrowReceiver';

export interface ThrowAssistOptions {
  readonly endpointRadius: number;
  readonly blendStartProgress: number;
  readonly minimumForwardDot: number;
  readonly maximumLateralOffset: number;
}

export interface ItemThrowSystemOptions {
  readonly distance: number;
  readonly durationSeconds: number;
  readonly arcHeight: number;
  readonly minimumLandingDistance: number;
  readonly landingSearchStep: number;
  readonly inputDirectionThreshold: number;
  readonly landingSpacing: number;
  readonly assist?: ThrowAssistOptions;
}

interface ThrowSceneBinding {
  readonly worldRoot: Object3D;
  readonly allItems: readonly PickableItem[];
  readonly floorDropValidator: FloorDropValidator;
  readonly receivers: readonly ThrowReceiver[];
}

interface ActiveItemThrow {
  readonly item: PickableItem;
  readonly worldRoot: Object3D;
  readonly startPosition: Vector3;
  readonly unassistedLandingPosition: Vector3;
  readonly landingPosition: Vector3;
  readonly receiverReservation: ThrowReceiverReservation | null;
  elapsedSeconds: number;
}

interface LandingSearchOptions {
  readonly maximumDistance: number;
  readonly minimumDistance: number;
  readonly step: number;
}

type LandingValidator = (position: Readonly<Vector3Like>) => boolean;

export function sampleThrowTrajectory(
  startPosition: Readonly<Vector3Like>,
  unassistedLandingPosition: Readonly<Vector3Like>,
  assistedLandingPosition: Readonly<Vector3Like>,
  progress: number,
  arcHeight: number,
  assistBlendStart: number,
  target: Vector3 = new Vector3(),
): Vector3 {
  const safeProgress = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  target.set(
    startPosition.x + (unassistedLandingPosition.x - startPosition.x) * safeProgress,
    startPosition.y + (unassistedLandingPosition.y - startPosition.y) * safeProgress,
    startPosition.z + (unassistedLandingPosition.z - startPosition.z) * safeProgress,
  );
  target.y += 4 * Math.max(0, arcHeight) * safeProgress * (1 - safeProgress);
  const safeBlendStart = Math.min(
    1,
    Math.max(0, Number.isFinite(assistBlendStart) ? assistBlendStart : 1),
  );
  const assistProgress = safeBlendStart >= 1
    ? (safeProgress >= 1 ? 1 : 0)
    : Math.min(1, Math.max(0, (safeProgress - safeBlendStart) / (1 - safeBlendStart)));
  const smoothAssist = assistProgress * assistProgress * (3 - 2 * assistProgress);
  target.x += (assistedLandingPosition.x - unassistedLandingPosition.x) * smoothAssist;
  target.y += (assistedLandingPosition.y - unassistedLandingPosition.y) * smoothAssist;
  target.z += (assistedLandingPosition.z - unassistedLandingPosition.z) * smoothAssist;
  return target;
}

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
  private readonly activeReceives = new Map<PickableItem, ThrowReceiveTransition>();
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
    if (options.assist !== undefined) {
      const assist = options.assist;
      if (
        !Number.isFinite(assist.endpointRadius)
        || assist.endpointRadius <= 0
        || !Number.isFinite(assist.blendStartProgress)
        || assist.blendStartProgress < 0
        || assist.blendStartProgress >= 1
        || !Number.isFinite(assist.minimumForwardDot)
        || assist.minimumForwardDot < -1
        || assist.minimumForwardDot > 1
        || !Number.isFinite(assist.maximumLateralOffset)
        || assist.maximumLateralOffset <= 0
      ) {
        throw new Error('Throw assist options are invalid.');
      }
    }
  }

  public get activeThrowCount(): number {
    return this.activeThrows.size;
  }

  public get activeReceiveCount(): number {
    return this.activeReceives.size;
  }

  public get landingSpacing(): number {
    return this.options.landingSpacing;
  }

  public bindScene(
    worldRoot: Object3D,
    allItems: readonly PickableItem[],
    floorDropValidator: FloorDropValidator,
    receivers: readonly ThrowReceiver[] = [],
  ): void {
    this.unbindScene();
    this.sceneBinding = { worldRoot, allItems, floorDropValidator, receivers };
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
    for (const [item, transition] of this.activeReceives) {
      if (transition.update(delta)) {
        this.activeReceives.delete(item);
      }
    }
    for (const [item, trajectory] of this.activeThrows) {
      if (!item.isThrown || !item.isActive) {
        trajectory.receiverReservation?.cancel();
        this.activeThrows.delete(item);
        continue;
      }

      trajectory.elapsedSeconds = Math.min(
        this.options.durationSeconds,
        trajectory.elapsedSeconds + delta,
      );
      const progress = trajectory.elapsedSeconds / this.options.durationSeconds;
      sampleThrowTrajectory(
        trajectory.startPosition,
        trajectory.unassistedLandingPosition,
        trajectory.landingPosition,
        progress,
        this.options.arcHeight,
        trajectory.receiverReservation === null
          ? 1
          : (this.options.assist?.blendStartProgress ?? 1),
        item.object.position,
      );

      if (progress >= 1) {
        if (trajectory.receiverReservation === null) {
          item.placeOnFloor(trajectory.worldRoot, trajectory.landingPosition);
        } else {
          const transition = trajectory.receiverReservation.complete(
            item,
            trajectory.worldRoot,
          );
          if (transition !== null) {
            this.activeReceives.set(item, transition);
          }
        }
        this.activeThrows.delete(item);
      }
    }
  }

  public cancelAll(): void {
    for (const trajectory of this.activeThrows.values()) {
      trajectory.receiverReservation?.cancel();
      if (trajectory.item.isThrown && trajectory.item.isActive) {
        trajectory.item.placeOnFloor(
          trajectory.worldRoot,
          trajectory.unassistedLandingPosition,
        );
      }
    }
    this.activeThrows.clear();
    for (const transition of this.activeReceives.values()) {
      transition.cancel();
    }
    this.activeReceives.clear();
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

    const unassistedLandingPosition = findFarthestValidLandingPosition(
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
    if (unassistedLandingPosition === null) {
      return false;
    }

    const receiverReservation = this.selectReceiverReservation(
      item,
      binding,
      unassistedLandingPosition,
    );
    const landingPosition = receiverReservation?.targetPosition.clone()
      ?? unassistedLandingPosition.clone();
    if (!this.carry.releaseForThrow(item, binding.worldRoot)) {
      receiverReservation?.cancel();
      return false;
    }

    this.activeThrows.set(item, {
      item,
      worldRoot: binding.worldRoot,
      startPosition: item.object.position.clone(),
      unassistedLandingPosition,
      landingPosition,
      receiverReservation,
      elapsedSeconds: 0,
    });
    this.player.triggerThrow();
    return true;
  }

  private selectReceiverReservation(
    item: PickableItem,
    binding: ThrowSceneBinding,
    intendedLanding: Readonly<Vector3>,
  ): ThrowReceiverReservation | null {
    const assist = this.options.assist;
    if (assist === undefined || binding.receivers.length === 0) {
      return null;
    }
    const directionLength = Math.hypot(this.localDirection.x, this.localDirection.z);
    if (directionLength <= Number.EPSILON) {
      return null;
    }
    const direction = {
      x: this.localDirection.x / directionLength,
      y: 0,
      z: this.localDirection.z / directionLength,
    };
    const context: ThrowAssistContext = {
      worldRoot: binding.worldRoot,
      origin: this.playerLocalPosition,
      direction,
      intendedLanding,
      isFloorPositionValid: (position) => (
        binding.floorDropValidator(position, item, binding.allItems)
        && this.isLandingReservationFree(position, item)
      ),
    };
    const candidates: Array<{ candidate: ThrowReceiverCandidate; score: number }> = [];
    for (const receiver of binding.receivers) {
      const candidate = receiver.getThrowReceiverCandidate(item, context);
      if (candidate === null) {
        continue;
      }
      const endpointDistance = Math.hypot(
        candidate.targetPosition.x - intendedLanding.x,
        candidate.targetPosition.z - intendedLanding.z,
      );
      if (endpointDistance > Math.min(assist.endpointRadius, candidate.assistRadius)) {
        continue;
      }
      const targetX = candidate.targetPosition.x - this.playerLocalPosition.x;
      const targetZ = candidate.targetPosition.z - this.playerLocalPosition.z;
      const targetDistance = Math.hypot(targetX, targetZ);
      if (targetDistance <= Number.EPSILON) {
        continue;
      }
      const forwardDot = (targetX * direction.x + targetZ * direction.z) / targetDistance;
      const lateralOffset = Math.abs(direction.x * targetZ - direction.z * targetX);
      if (
        forwardDot < assist.minimumForwardDot
        || lateralOffset > assist.maximumLateralOffset
      ) {
        continue;
      }
      candidates.push({ candidate, score: endpointDistance });
    }
    candidates.sort((left, right) => (
      left.candidate.priority - right.candidate.priority
      || left.score - right.score
      || compareIds(left.candidate.id, right.candidate.id)
    ));
    for (const { candidate } of candidates) {
      const reservation = candidate.reserve();
      if (reservation !== null) {
        return reservation;
      }
    }
    return null;
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

function compareIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
