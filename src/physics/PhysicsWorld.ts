import RAPIER from '@dimforge/rapier3d';
import { KinematicCharacter, type ReadonlyVector3 } from './KinematicCharacter';

interface FixedBoxOptions {
  readonly position: ReadonlyVector3;
  readonly size: ReadonlyVector3;
  readonly friction?: number;
}

interface CharacterOptions {
  readonly position: ReadonlyVector3;
  readonly radius: number;
  readonly halfHeight: number;
  readonly offset: number;
}

export interface PhysicsBodyHandle {
  dispose(): void;
}

export class PhysicsWorld {
  private readonly characterControllers = new Set<RAPIER.KinematicCharacterController>();
  private disposed = false;

  private constructor(private readonly world: RAPIER.World) {}

  public static create(gravity: ReadonlyVector3): PhysicsWorld {
    return new PhysicsWorld(new RAPIER.World(gravity));
  }

  public createFixedBox(options: FixedBoxOptions): PhysicsBodyHandle {
    const bodyDescription = RAPIER.RigidBodyDesc.fixed().setTranslation(
      options.position.x,
      options.position.y,
      options.position.z,
    );
    const body = this.world.createRigidBody(bodyDescription);
    const colliderDescription = RAPIER.ColliderDesc.cuboid(
      options.size.x / 2,
      options.size.y / 2,
      options.size.z / 2,
    ).setFriction(options.friction ?? 0.7);

    this.world.createCollider(colliderDescription, body);

    let handleDisposed = false;
    return {
      dispose: (): void => {
        if (handleDisposed || this.disposed) {
          return;
        }
        handleDisposed = true;
        this.world.removeRigidBody(body);
      },
    };
  }

  public createKinematicCharacter(options: CharacterOptions): KinematicCharacter {
    const bodyDescription = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
      options.position.x,
      options.position.y,
      options.position.z,
    );
    const body = this.world.createRigidBody(bodyDescription);
    const colliderDescription = RAPIER.ColliderDesc.capsule(options.halfHeight, options.radius).setFriction(0);
    const collider = this.world.createCollider(colliderDescription, body);
    const controller = this.world.createCharacterController(options.offset);

    controller.setSlideEnabled(true);
    controller.enableSnapToGround(0.18);
    this.characterControllers.add(controller);

    return new KinematicCharacter(body, collider, controller);
  }

  public step(deltaSeconds: number): void {
    this.world.timestep = deltaSeconds;
    this.world.step();
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }
    for (const controller of this.characterControllers) {
      this.world.removeCharacterController(controller);
    }
    this.characterControllers.clear();
    this.disposed = true;
    this.world.free();
  }
}
