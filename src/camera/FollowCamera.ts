import { Object3D, PerspectiveCamera, Vector3 } from 'three';

interface FollowCameraOptions {
  readonly offset: Readonly<Vector3>;
  readonly lookAtOffset: Readonly<Vector3>;
  readonly positionSharpness: number;
  readonly lookAtSharpness: number;
}

export class FollowCamera {
  private readonly desiredPosition = new Vector3();
  private readonly desiredLookAt = new Vector3();
  private readonly currentLookAt = new Vector3();

  public constructor(
    private readonly camera: PerspectiveCamera,
    private readonly target: Object3D,
    private readonly options: FollowCameraOptions,
  ) {
    this.snapToTarget();
  }

  public update(deltaSeconds: number): void {
    this.desiredPosition.copy(this.target.position).add(this.options.offset);
    this.desiredLookAt.copy(this.target.position).add(this.options.lookAtOffset);

    const positionBlend = 1 - Math.exp(-this.options.positionSharpness * deltaSeconds);
    const lookAtBlend = 1 - Math.exp(-this.options.lookAtSharpness * deltaSeconds);
    this.camera.position.lerp(this.desiredPosition, positionBlend);
    this.currentLookAt.lerp(this.desiredLookAt, lookAtBlend);
    this.camera.lookAt(this.currentLookAt);
  }

  private snapToTarget(): void {
    this.camera.position.copy(this.target.position).add(this.options.offset);
    this.currentLookAt.copy(this.target.position).add(this.options.lookAtOffset);
    this.camera.lookAt(this.currentLookAt);
  }
}
