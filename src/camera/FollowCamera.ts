import { Object3D, PerspectiveCamera, Vector3 } from 'three';

interface FollowCameraOptions {
  readonly offset: Readonly<Vector3>;
  readonly lookAtOffset: Readonly<Vector3>;
  readonly positionSharpness: number;
  readonly lookAtSharpness: number;
  readonly velocitySharpness: number;
  readonly lookAheadSeconds: number;
  readonly maxLookAhead: number;
  readonly teleportSnapDistance: number;
}

export class FollowCamera {
  private readonly desiredPosition = new Vector3();
  private readonly desiredLookAt = new Vector3();
  private readonly currentLookAt = new Vector3();
  private readonly targetPosition = new Vector3();
  private readonly previousTargetPosition = new Vector3();
  private readonly targetVelocity = new Vector3();
  private readonly smoothedVelocity = new Vector3();
  private readonly lookAhead = new Vector3();

  public constructor(
    private readonly camera: PerspectiveCamera,
    private readonly target: Object3D,
    private readonly options: FollowCameraOptions,
  ) {
    this.snapToTarget();
  }

  public update(deltaSeconds: number): void {
    const delta = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0;
    this.target.getWorldPosition(this.targetPosition);
    const targetTravel = this.targetPosition.distanceTo(this.previousTargetPosition);
    if (targetTravel > this.options.teleportSnapDistance) {
      this.snapToTarget();
      return;
    }

    if (delta > 0) {
      this.targetVelocity.subVectors(this.targetPosition, this.previousTargetPosition)
        .multiplyScalar(1 / delta);
      this.targetVelocity.y = 0;
      if (this.targetVelocity.lengthSq() < 0.0004) {
        this.targetVelocity.set(0, 0, 0);
      }
      const velocityBlend = 1 - Math.exp(-this.options.velocitySharpness * delta);
      this.smoothedVelocity.lerp(this.targetVelocity, velocityBlend);
    }
    this.previousTargetPosition.copy(this.targetPosition);

    this.lookAhead.copy(this.smoothedVelocity).multiplyScalar(this.options.lookAheadSeconds);
    if (this.lookAhead.length() > this.options.maxLookAhead) {
      this.lookAhead.setLength(this.options.maxLookAhead);
    }
    this.desiredPosition.copy(this.targetPosition).add(this.options.offset).add(this.lookAhead);
    this.desiredLookAt.copy(this.targetPosition).add(this.options.lookAtOffset).add(this.lookAhead);

    const positionBlend = 1 - Math.exp(-this.options.positionSharpness * delta);
    const lookAtBlend = 1 - Math.exp(-this.options.lookAtSharpness * delta);
    this.camera.position.lerp(this.desiredPosition, positionBlend);
    this.currentLookAt.lerp(this.desiredLookAt, lookAtBlend);
    this.camera.lookAt(this.currentLookAt);
  }

  public snapToTarget(): void {
    this.target.getWorldPosition(this.targetPosition);
    this.previousTargetPosition.copy(this.targetPosition);
    this.smoothedVelocity.set(0, 0, 0);
    this.lookAhead.set(0, 0, 0);
    this.camera.position.copy(this.targetPosition).add(this.options.offset);
    this.currentLookAt.copy(this.targetPosition).add(this.options.lookAtOffset);
    this.camera.lookAt(this.currentLookAt);
  }
}
