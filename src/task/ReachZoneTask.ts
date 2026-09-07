import {
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  type Object3D,
  type Vector3Like,
} from 'three';
import type { Task, TaskState } from './Task';

interface ReachZoneTaskOptions {
  readonly id: string;
  readonly label: string;
  readonly playerPosition: Readonly<Vector3Like>;
  readonly targetPosition: Readonly<Vector3Like>;
  readonly radius: number;
  readonly markerParent: Object3D;
}

const MARKER_INNER_RADIUS_RATIO = 0.72;
const MARKER_SEGMENTS = 40;
const MARKER_HEIGHT = 0.035;
const MARKER_COLOR = 0xffdc68;

export class ReachZoneTask implements Task {
  public readonly id: string;
  public readonly label: string;
  public readonly marker = new Group();
  private readonly radiusSquared: number;
  private taskState: TaskState = 'idle';

  public constructor(private readonly options: ReachZoneTaskOptions) {
    this.id = options.id;
    this.label = options.label;
    this.radiusSquared = options.radius * options.radius;

    const ring = new Mesh(
      new RingGeometry(
        options.radius * MARKER_INNER_RADIUS_RATIO,
        options.radius,
        MARKER_SEGMENTS,
      ),
      new MeshBasicMaterial({
        color: MARKER_COLOR,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        side: DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = MARKER_HEIGHT;

    this.marker.name = `ReachZoneMarker:${options.id}`;
    this.marker.position.copy(options.targetPosition);
    this.marker.visible = false;
    this.marker.add(ring);
    options.markerParent.add(this.marker);
  }

  public get state(): TaskState {
    return this.taskState;
  }

  public get remainingSeconds(): null {
    return null;
  }

  public start(): void {
    this.taskState = 'running';
    this.marker.visible = true;
  }

  public update(_deltaSeconds: number): void {
    if (this.taskState !== 'running') {
      return;
    }

    const dx = this.options.playerPosition.x - this.options.targetPosition.x;
    const dz = this.options.playerPosition.z - this.options.targetPosition.z;
    if (dx * dx + dz * dz <= this.radiusSquared) {
      this.taskState = 'succeeded';
      this.marker.visible = false;
    }
  }

  public reset(): void {
    this.taskState = 'idle';
    this.marker.visible = false;
  }
}
