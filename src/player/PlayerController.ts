import { Group, type Vector3Like } from 'three';
import type { InputManager } from '../input/InputManager';
import type { KinematicCharacter } from '../physics/KinematicCharacter';
import { createPlayerModel } from './createPlayerModel';

interface PlayerControllerOptions {
  readonly speed: number;
  readonly turnSharpness: number;
  readonly groundProbeSpeed: number;
}

const MOVEMENT_EPSILON_SQUARED = 0.0001;

export class PlayerController {
  public readonly object: Group;
  public readonly carryAnchor: Group;
  private readonly desiredDisplacement = { x: 0, y: 0, z: 0 };
  private targetFacing = 0;
  private isMoving = false;
  private movementEnabled = true;

  public constructor(
    private readonly input: InputManager,
    private readonly character: KinematicCharacter,
    private readonly options: PlayerControllerOptions,
  ) {
    const model = createPlayerModel();
    this.object = model.root;
    this.carryAnchor = model.carryAnchor;
    character.copyPositionTo(this.object.position);
  }

  public updateBeforePhysics(deltaSeconds: number): void {
    const movement = this.movementEnabled ? this.input.getMovement() : { x: 0, y: 0 };
    this.desiredDisplacement.x = movement.x * this.options.speed * deltaSeconds;
    this.desiredDisplacement.y = -this.options.groundProbeSpeed * deltaSeconds;
    this.desiredDisplacement.z = movement.y * this.options.speed * deltaSeconds;

    this.isMoving = movement.x * movement.x + movement.y * movement.y > MOVEMENT_EPSILON_SQUARED;
    if (this.isMoving) {
      this.targetFacing = Math.atan2(movement.x, movement.y);
    }

    this.character.move(this.desiredDisplacement);
  }

  public get isMovementEnabled(): boolean {
    return this.movementEnabled;
  }

  public setMovementEnabled(enabled: boolean): void {
    this.movementEnabled = enabled;
    if (!enabled) {
      this.isMoving = false;
    }
  }

  public reset(position: Readonly<Vector3Like>, facingRadians: number): void {
    this.character.resetPosition(position);
    this.object.position.copy(position);
    this.object.rotation.y = facingRadians;
    this.targetFacing = facingRadians;
    this.isMoving = false;
  }

  public updateAfterPhysics(deltaSeconds: number): void {
    this.character.copyPositionTo(this.object.position);

    if (!this.isMoving) {
      return;
    }

    const currentFacing = this.object.rotation.y;
    const shortestAngle = Math.atan2(
      Math.sin(this.targetFacing - currentFacing),
      Math.cos(this.targetFacing - currentFacing),
    );
    const blend = 1 - Math.exp(-this.options.turnSharpness * deltaSeconds);
    this.object.rotation.y = currentFacing + shortestAngle * blend;
  }
}
