import type RAPIER from '@dimforge/rapier3d';

export interface MutableVector3 {
  x: number;
  y: number;
  z: number;
}

export interface ReadonlyVector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export class KinematicCharacter {
  public constructor(
    private readonly body: RAPIER.RigidBody,
    private readonly collider: RAPIER.Collider,
    private readonly controller: RAPIER.KinematicCharacterController,
  ) {}

  public move(displacement: ReadonlyVector3): void {
    this.controller.computeColliderMovement(this.collider, displacement);
    const correctedMovement = this.controller.computedMovement();
    const currentPosition = this.body.translation();

    this.body.setNextKinematicTranslation({
      x: currentPosition.x + correctedMovement.x,
      y: currentPosition.y + correctedMovement.y,
      z: currentPosition.z + correctedMovement.z,
    });
  }

  public copyPositionTo(target: MutableVector3): void {
    const position = this.body.translation();
    target.x = position.x;
    target.y = position.y;
    target.z = position.z;
  }

  public resetPosition(position: ReadonlyVector3): void {
    this.body.setTranslation(position, true);
    this.body.setNextKinematicTranslation(position);
  }
}
