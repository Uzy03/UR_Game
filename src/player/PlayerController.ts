import { Group } from 'three';
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
  public readonly object: Group = createPlayerModel();
  private readonly desiredDisplacement = { x: 0, y: 0, z: 0 };
  private targetFacing = 0;
  private isMoving = false;

  public constructor(
    private readonly input: InputManager,
    private readonly character: KinematicCharacter,
    private readonly options: PlayerControllerOptions,
  ) {
    character.copyPositionTo(this.object.position);
  }

  public updateBeforePhysics(deltaSeconds: number): void {
    const movement = this.input.getMovement();
    this.desiredDisplacement.x = movement.x * this.options.speed * deltaSeconds;
    this.desiredDisplacement.y = -this.options.groundProbeSpeed * deltaSeconds;
    this.desiredDisplacement.z = movement.y * this.options.speed * deltaSeconds;

    this.isMoving = movement.x * movement.x + movement.y * movement.y > MOVEMENT_EPSILON_SQUARED;
    if (this.isMoving) {
      this.targetFacing = Math.atan2(movement.x, movement.y);
    }

    this.character.move(this.desiredDisplacement);
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
