import { Group, Quaternion, Vector3, type Vector3Like } from 'three';
import { disposeObject3D } from '../core/disposeObject3D';
import type { Interactable, InteractionContext } from '../interaction/Interactable';
import { InteractionHighlight } from '../visual/InteractionHighlight';
import type { CharacterAnimator } from '../visual/CharacterAnimator';
import type { PickableItem } from '../interaction/PickableItem';
import {
  THROW_RECEIVER_PRIORITY,
  type ThrowAssistContext,
  type ThrowReceiver,
  type ThrowReceiverCandidate,
  type ThrowReceiverReservation,
} from '../interaction/ThrowReceiver';
import { createNPCModel } from './createNPCModel';

interface NPCControllerOptions {
  readonly id: string;
  readonly displayName: string;
  readonly position: Readonly<Vector3Like>;
  readonly moveSpeed: number;
  readonly turnSharpness: number;
  readonly throwCatch: NpcThrowCatchOptions;
}

export interface NpcThrowCatchOptions {
  readonly assistRadius: number;
  readonly holdSeconds: number;
  readonly releaseDistance: number;
}

const ARRIVAL_DISTANCE = 0.03;
const MOVEMENT_EPSILON_SQUARED = 0.000001;

export class NPCController implements Interactable, ThrowReceiver {
  public readonly id: string;
  public readonly displayName: string;
  public readonly object: Group;
  public readonly catchAnchor: Group;
  public readonly speechAnchor: Group;
  private readonly highlight: InteractionHighlight;
  private readonly animator: CharacterAnimator;
  private readonly destination = new Vector3();
  private readonly movement = new Vector3();
  private hasDestination = false;
  private interactionEnabled = true;
  private interactionHandler: (() => boolean) | null = null;
  private throwCatchReserved = false;
  private disposed = false;

  public constructor(private readonly options: NPCControllerOptions) {
    this.id = options.id;
    this.displayName = options.displayName;
    const model = createNPCModel();
    this.object = model.root;
    this.object.name = `NPC:${this.id}`;
    this.object.position.copy(options.position);
    this.highlight = new InteractionHighlight(model.highlight, 0.82);
    this.animator = model.animator;
    this.catchAnchor = model.catchAnchor;
    this.speechAnchor = model.speechAnchor;
  }

  public setInteractionHandler(handler: (() => boolean) | null): void {
    this.interactionHandler = handler;
  }

  public get isMoving(): boolean {
    return this.hasDestination;
  }

  public get isInteractionEnabled(): boolean {
    return this.interactionEnabled;
  }

  public setInteractionEnabled(enabled: boolean): void {
    this.interactionEnabled = enabled;
    if (!enabled) {
      this.setHighlighted(false);
    }
  }

  public canInteract(_context: InteractionContext): boolean {
    return !this.disposed && this.interactionEnabled && this.interactionHandler !== null;
  }

  public getInteractionLabel(_context: InteractionContext): string {
    return 'Talk';
  }

  public interact(_context: InteractionContext): boolean {
    const didInteract = (
      !this.disposed
      && this.interactionEnabled
      && (this.interactionHandler?.() ?? false)
    );
    if (didInteract) {
      this.animator.triggerInteraction();
    }
    return didInteract;
  }

  public getInteractionPosition(target: Vector3): Vector3 {
    this.object.getWorldPosition(target);
    target.y += 0.25;
    return target;
  }

  public setHighlighted(highlighted: boolean): void {
    this.highlight.setActive(highlighted);
  }

  public moveTo(position: Readonly<Vector3Like>): void {
    this.destination.copy(position);
    this.hasDestination = true;
  }

  public stop(): void {
    this.hasDestination = false;
  }

  public update(deltaSeconds: number): void {
    if (this.disposed) {
      return;
    }

    let actualSpeed = 0;
    if (this.hasDestination) {
      this.movement.subVectors(this.destination, this.object.position);
      this.movement.y = 0;
      const distance = this.movement.length();
      if (distance <= ARRIVAL_DISTANCE) {
        this.object.position.x = this.destination.x;
        this.object.position.z = this.destination.z;
        this.stop();
      } else {
        this.movement.normalize();
        const distanceThisFrame = Math.min(distance, this.options.moveSpeed * deltaSeconds);
        this.object.position.addScaledVector(this.movement, distanceThisFrame);
        actualSpeed = deltaSeconds > 0 ? distanceThisFrame / deltaSeconds : 0;

        if (this.movement.lengthSq() > MOVEMENT_EPSILON_SQUARED) {
          const targetFacing = Math.atan2(this.movement.x, this.movement.z);
          const currentFacing = this.object.rotation.y;
          const shortestAngle = Math.atan2(
            Math.sin(targetFacing - currentFacing),
            Math.cos(targetFacing - currentFacing),
          );
          const blend = 1 - Math.exp(-this.options.turnSharpness * deltaSeconds);
          this.object.rotation.y = currentFacing + shortestAngle * blend;
        }
      }
    }

    this.animator.update(deltaSeconds, {
      actualSpeed,
      maximumSpeed: this.options.moveSpeed,
      carrying: false,
    });
    this.highlight.update(deltaSeconds);
  }

  public getThrowReceiverCandidate(
    item: PickableItem,
    context: ThrowAssistContext,
  ): ThrowReceiverCandidate | null {
    if (
      this.disposed
      || this.hasDestination
      || this.throwCatchReserved
      || !item.isActive
    ) {
      return null;
    }
    const releasePosition = this.findSafeReleasePosition(context);
    if (releasePosition === null) {
      return null;
    }
    const targetPosition = this.catchAnchor.getWorldPosition(new Vector3());
    context.worldRoot.worldToLocal(targetPosition);
    return {
      id: `npc-catch:${this.id}`,
      priority: THROW_RECEIVER_PRIORITY.npc,
      assistRadius: this.options.throwCatch.assistRadius,
      targetPosition,
      reserve: () => this.reserveCatch(targetPosition, releasePosition),
    };
  }

  public triggerDashBump(
    worldDirection: Readonly<{ x: number; z: number }>,
    offset: number,
    recoverySeconds: number,
  ): void {
    if (this.disposed) {
      return;
    }
    const worldQuaternion = this.object.getWorldQuaternion(new Quaternion()).invert();
    const localDirection = new Vector3(worldDirection.x, 0, worldDirection.z)
      .applyQuaternion(worldQuaternion);
    const length = Math.hypot(localDirection.x, localDirection.z);
    if (length <= Number.EPSILON) {
      return;
    }
    this.animator.triggerBump(
      { x: localDirection.x / length, z: localDirection.z / length },
      offset,
      recoverySeconds,
    );
  }

  public getPresentationOffset(target: Vector3): Vector3 {
    return this.animator.getPresentationOffset(target);
  }

  public resetPresentation(): void {
    this.animator.reset();
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.stop();
    this.interactionHandler = null;
    this.throwCatchReserved = false;
    this.animator.reset();
    this.setHighlighted(false);
    this.object.removeFromParent();
    disposeObject3D(this.object);
    this.object.clear();
  }

  private reserveCatch(
    targetPosition: Readonly<Vector3>,
    releasePosition: Readonly<Vector3>,
  ): ThrowReceiverReservation | null {
    if (this.disposed || this.hasDestination || this.throwCatchReserved) {
      return null;
    }
    this.throwCatchReserved = true;
    let reservationActive = true;
    const releaseReservation = (): void => {
      if (reservationActive) {
        this.throwCatchReserved = false;
        reservationActive = false;
      }
    };
    return {
      targetPosition: targetPosition.clone(),
      cancel: releaseReservation,
      complete: (caughtItem, worldRoot) => {
        caughtItem.placeAt(this.catchAnchor);
        this.animator.triggerCatch();
        let elapsedSeconds = 0;
        let receiving = true;
        const finish = (): void => {
          if (!receiving) {
            return;
          }
          receiving = false;
          if (caughtItem.isActive) {
            caughtItem.placeOnFloor(worldRoot, releasePosition);
          }
          releaseReservation();
        };
        return {
          update: (deltaSeconds) => {
            const delta = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0;
            elapsedSeconds += delta;
            if (elapsedSeconds >= this.options.throwCatch.holdSeconds || this.disposed) {
              finish();
            }
            return !receiving;
          },
          cancel: finish,
        };
      },
    };
  }

  private findSafeReleasePosition(
    context: ThrowAssistContext,
  ): Vector3 | null {
    const npcPosition = this.object.getWorldPosition(new Vector3());
    context.worldRoot.worldToLocal(npcPosition);
    const forwardEnd = this.object.localToWorld(new Vector3(0, 0, 1));
    context.worldRoot.worldToLocal(forwardEnd);
    const forwardX = forwardEnd.x - npcPosition.x;
    const forwardZ = forwardEnd.z - npcPosition.z;
    const forwardLength = Math.hypot(forwardX, forwardZ);
    if (forwardLength <= Number.EPSILON) {
      return null;
    }
    const normalizedX = forwardX / forwardLength;
    const normalizedZ = forwardZ / forwardLength;
    for (const angle of [0, Math.PI / 5, -Math.PI / 5]) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const directionX = normalizedX * cos - normalizedZ * sin;
      const directionZ = normalizedX * sin + normalizedZ * cos;
      const candidate = new Vector3(
        npcPosition.x + directionX * this.options.throwCatch.releaseDistance,
        0,
        npcPosition.z + directionZ * this.options.throwCatch.releaseDistance,
      );
      if (context.isFloorPositionValid(candidate)) {
        return candidate;
      }
    }
    return null;
  }
}
