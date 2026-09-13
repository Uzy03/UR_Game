import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  type Vector3Like,
} from 'three';
import { disposeObject3D } from '../core/disposeObject3D';
import { stepPlanarVelocity } from '../player/MovementSmoothing';

export interface WorldMapVehicleOptions {
  readonly speed: number;
  readonly acceleration: number;
  readonly deceleration: number;
  readonly turnSharpness: number;
  readonly bounds: {
    readonly minX: number;
    readonly maxX: number;
    readonly minZ: number;
    readonly maxZ: number;
  };
}

export class WorldMapVehicle {
  public readonly object = new Group();
  private readonly visual = new Group();
  private readonly wheels: Mesh[] = [];
  private readonly velocity = { x: 0, z: 0 };
  private targetFacing = 0;
  private visualTime = 0;

  public constructor(private readonly options: WorldMapVehicleOptions) {
    this.object.name = 'WorldMapVehicle';
    this.visual.name = 'WorldMapVehicleVisual';
    this.object.add(this.visual);
    this.createVisual();
  }

  public reset(position: Readonly<Vector3Like>, facingRadians = 0): void {
    this.object.position.set(position.x, position.y, position.z);
    this.object.rotation.y = facingRadians;
    this.targetFacing = facingRadians;
    this.velocity.x = 0;
    this.velocity.z = 0;
    this.visualTime = 0;
    this.visual.position.y = 0;
    this.visual.rotation.z = 0;
  }

  public update(
    deltaSeconds: number,
    movement: { readonly x: number; readonly y: number },
  ): void {
    const delta = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0;
    this.visualTime += delta;
    stepPlanarVelocity(
      this.velocity,
      { x: movement.x, z: movement.y },
      this.options.speed,
      this.options.acceleration,
      this.options.deceleration,
      delta,
    );

    this.object.position.x = Math.min(
      this.options.bounds.maxX,
      Math.max(this.options.bounds.minX, this.object.position.x + this.velocity.x * delta),
    );
    this.object.position.z = Math.min(
      this.options.bounds.maxZ,
      Math.max(this.options.bounds.minZ, this.object.position.z + this.velocity.z * delta),
    );

    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    if (speed > 0.01) {
      this.targetFacing = Math.atan2(this.velocity.x, this.velocity.z);
      const shortestAngle = Math.atan2(
        Math.sin(this.targetFacing - this.object.rotation.y),
        Math.cos(this.targetFacing - this.object.rotation.y),
      );
      const blend = 1 - Math.exp(-this.options.turnSharpness * delta);
      this.object.rotation.y += shortestAngle * blend;
    }

    const movementAmount = this.options.speed > 0 ? Math.min(1, speed / this.options.speed) : 0;
    this.visual.rotation.z = -this.velocity.x * 0.012;
    this.visual.position.y = Math.sin(this.visualTime * 7.2) * 0.012 * movementAmount;
    for (const wheel of this.wheels) {
      wheel.rotation.x -= speed * delta * 2.8;
    }
  }

  public dispose(): void {
    disposeObject3D(this.object);
    this.object.clear();
  }

  private createVisual(): void {
    const bodyMaterial = new MeshStandardMaterial({ color: 0x8d9298, roughness: 0.58 });
    const trimMaterial = new MeshStandardMaterial({ color: 0x555b61, roughness: 0.62 });
    const windowMaterial = new MeshStandardMaterial({
      color: 0x26343c,
      roughness: 0.28,
      metalness: 0.08,
    });
    const lightMaterial = new MeshStandardMaterial({
      color: 0xffefba,
      emissive: 0x6f5a25,
      roughness: 0.35,
    });

    const lowerBody = new Mesh(new BoxGeometry(1.08, 0.42, 1.65), bodyMaterial);
    lowerBody.name = 'WorldMapVehicleBody';
    lowerBody.position.y = 0.46;
    const cabin = new Mesh(new BoxGeometry(0.98, 0.58, 1.04), bodyMaterial);
    cabin.name = 'WorldMapVehicleCabin';
    cabin.position.set(0, 0.91, -0.08);
    const windshield = new Mesh(new BoxGeometry(0.82, 0.36, 0.035), windowMaterial);
    windshield.position.set(0, 0.94, 0.455);
    windshield.rotation.x = -0.08;
    const rearWindow = windshield.clone();
    rearWindow.position.z = -0.61;
    const leftWindow = new Mesh(new BoxGeometry(0.035, 0.34, 0.64), windowMaterial);
    leftWindow.position.set(-0.505, 0.94, -0.05);
    const rightWindow = leftWindow.clone();
    rightWindow.position.x = 0.505;
    const frontTrim = new Mesh(new BoxGeometry(0.88, 0.18, 0.08), trimMaterial);
    frontTrim.position.set(0, 0.4, 0.84);
    this.visual.add(
      lowerBody,
      cabin,
      windshield,
      rearWindow,
      leftWindow,
      rightWindow,
      frontTrim,
    );

    for (const x of [-0.56, 0.56]) {
      for (const z of [-0.52, 0.52]) {
        const wheel = new Mesh(
          new CylinderGeometry(0.2, 0.2, 0.14, 14),
          new MeshStandardMaterial({ color: 0x25282c, roughness: 0.9 }),
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.name = 'WorldMapVehicleWheel';
        wheel.position.set(x, 0.28, z);
        this.visual.add(wheel);
        this.wheels.push(wheel);
      }
    }

    for (const x of [-0.31, 0.31]) {
      const light = new Mesh(new BoxGeometry(0.2, 0.13, 0.045), lightMaterial);
      light.position.set(x, 0.55, 0.866);
      this.visual.add(light);
    }

    this.visual.traverse((object) => {
      if (object instanceof Mesh) {
        object.receiveShadow = true;
      }
    });
    lowerBody.castShadow = true;
    cabin.castShadow = true;
  }
}
