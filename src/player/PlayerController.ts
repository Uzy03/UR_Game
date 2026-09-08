import { Group, Vector3, type Vector3Like } from 'three';
import { InputAction } from '../input/InputAction';
import type { InputManager } from '../input/InputManager';
import type { KinematicCharacter } from '../physics/KinematicCharacter';
import type { CharacterAnimator } from '../visual/CharacterAnimator';
import { DashState, type DashStateOptions } from './DashState';
import { createPlayerModel } from './createPlayerModel';
import { stepPlanarVelocity } from './MovementSmoothing';
import { resolvePlanarActionDirection } from './PlanarActionDirection';

interface PlayerControllerOptions {
  readonly speed: number;
  readonly acceleration: number;
  readonly deceleration: number;
  readonly turnSharpness: number;
  readonly groundProbeSpeed: number;
  readonly dash: DashStateOptions & {
    readonly inputDirectionThreshold: number;
  };
}

const MOVEMENT_EPSILON_SQUARED = 0.0001;

export class PlayerController {
  public readonly object: Group;
  public readonly carryAnchor: Group;
  private readonly desiredDisplacement = { x: 0, y: 0, z: 0 };
  private readonly movementVelocity = { x: 0, z: 0 };
  private readonly previousResolvedPosition = new Vector3();
  private readonly animator: CharacterAnimator;
  private readonly dash: DashState;
  private targetFacing = 0;
  private carrying = false;
  private movementEnabled = true;

  public constructor(
    private readonly input: InputManager,
    private readonly character: KinematicCharacter,
    private readonly options: PlayerControllerOptions,
  ) {
    const model = createPlayerModel();
    this.object = model.root;
    this.carryAnchor = model.carryAnchor;
    this.animator = model.animator;
    this.dash = new DashState(options.dash);
    character.copyPositionTo(this.object.position);
    this.previousResolvedPosition.copy(this.object.position);
  }

  public updateBeforePhysics(deltaSeconds: number): void {
    const movement = this.movementEnabled ? this.input.getMovement() : { x: 0, y: 0 };
    if (this.movementEnabled && this.input.consumeActionPress(InputAction.Dash)) {
      const direction = resolvePlanarActionDirection(
        { x: movement.x, z: movement.y },
        this.object.rotation.y,
        this.options.dash.inputDirectionThreshold,
      );
      if (this.dash.tryStart(direction)) {
        this.targetFacing = Math.atan2(direction.x, direction.z);
        this.animator.triggerDash();
      }
    }

    stepPlanarVelocity(
      this.movementVelocity,
      { x: movement.x, z: movement.y },
      this.options.speed,
      this.options.acceleration,
      this.options.deceleration,
      deltaSeconds,
    );
    const dashStep = this.dash.advance(deltaSeconds);
    this.desiredDisplacement.x = (
      this.movementVelocity.x * dashStep.normalSeconds
      + dashStep.direction.x * dashStep.speed * dashStep.activeSeconds
    );
    this.desiredDisplacement.y = -this.options.groundProbeSpeed * (
      dashStep.activeSeconds + dashStep.normalSeconds
    );
    this.desiredDisplacement.z = (
      this.movementVelocity.z * dashStep.normalSeconds
      + dashStep.direction.z * dashStep.speed * dashStep.activeSeconds
    );

    const velocitySquared = (
      this.movementVelocity.x * this.movementVelocity.x
      + this.movementVelocity.z * this.movementVelocity.z
    );
    if (dashStep.activeSeconds > 0) {
      this.targetFacing = Math.atan2(dashStep.direction.x, dashStep.direction.z);
    } else if (velocitySquared > MOVEMENT_EPSILON_SQUARED) {
      this.targetFacing = Math.atan2(this.movementVelocity.x, this.movementVelocity.z);
    }

    this.character.move(this.desiredDisplacement);
  }

  public get isMovementEnabled(): boolean {
    return this.movementEnabled;
  }

  public get isDashing(): boolean {
    return this.dash.isActive;
  }

  public setMovementEnabled(enabled: boolean): void {
    this.movementEnabled = enabled;
    if (!enabled) {
      this.dash.cancelActive();
      this.movementVelocity.x = 0;
      this.movementVelocity.z = 0;
    }
  }

  public setCarrying(carrying: boolean): void {
    this.carrying = carrying;
  }

  public triggerInteraction(): void {
    this.animator.triggerInteraction();
  }

  public triggerThrow(): void {
    this.animator.triggerThrow();
  }

  public reset(position: Readonly<Vector3Like>, facingRadians: number): void {
    this.character.resetPosition(position);
    this.object.position.copy(position);
    this.object.rotation.y = facingRadians;
    this.targetFacing = facingRadians;
    this.movementVelocity.x = 0;
    this.movementVelocity.z = 0;
    this.dash.reset();
    this.carrying = false;
    this.previousResolvedPosition.copy(position);
    this.animator.reset();
  }

  public dispose(): void {
    this.dash.reset();
    this.animator.reset();
  }

  public updateAfterPhysics(deltaSeconds: number): void {
    this.previousResolvedPosition.copy(this.object.position);
    this.character.copyPositionTo(this.object.position);

    const resolvedDistance = Math.hypot(
      this.object.position.x - this.previousResolvedPosition.x,
      this.object.position.z - this.previousResolvedPosition.z,
    );
    const actualSpeed = deltaSeconds > 0 ? resolvedDistance / deltaSeconds : 0;
    this.animator.update(deltaSeconds, {
      actualSpeed,
      maximumSpeed: this.options.speed,
      carrying: this.carrying,
    });

    if (actualSpeed > 0.01) {
      const currentFacing = this.object.rotation.y;
      const shortestAngle = Math.atan2(
        Math.sin(this.targetFacing - currentFacing),
        Math.cos(this.targetFacing - currentFacing),
      );
      const blend = 1 - Math.exp(-this.options.turnSharpness * deltaSeconds);
      this.object.rotation.y = currentFacing + shortestAngle * blend;
    }
  }
}
