import type { PlanarDirection } from './PlanarActionDirection';

export interface DashStateOptions {
  readonly durationSeconds: number;
  readonly speed: number;
  readonly cooldownSeconds: number;
}

export interface DashFrameStep {
  readonly activeSeconds: number;
  readonly normalSeconds: number;
  readonly direction: PlanarDirection;
  readonly speed: number;
}

export class DashState {
  private readonly direction = { x: 0, z: 1 };
  private activeRemainingSeconds = 0;
  private cooldownRemainingSeconds = 0;

  public constructor(private readonly options: DashStateOptions) {
    for (const [label, value] of Object.entries(options)) {
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`Dash ${label} must be a finite positive number.`);
      }
    }
  }

  public get isActive(): boolean {
    return this.activeRemainingSeconds > 0;
  }

  public get canStart(): boolean {
    return this.cooldownRemainingSeconds <= 0;
  }

  public tryStart(direction: PlanarDirection): boolean {
    if (!this.canStart) {
      return false;
    }

    const length = Math.hypot(direction.x, direction.z);
    if (!Number.isFinite(length) || length <= Number.EPSILON) {
      return false;
    }

    this.direction.x = direction.x / length;
    this.direction.z = direction.z / length;
    this.activeRemainingSeconds = this.options.durationSeconds;
    this.cooldownRemainingSeconds = this.options.cooldownSeconds;
    return true;
  }

  public advance(deltaSeconds: number): DashFrameStep {
    const delta = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0;
    const activeSeconds = Math.min(delta, this.activeRemainingSeconds);
    this.activeRemainingSeconds = Math.max(0, this.activeRemainingSeconds - delta);
    this.cooldownRemainingSeconds = Math.max(0, this.cooldownRemainingSeconds - delta);

    return {
      activeSeconds,
      normalSeconds: delta - activeSeconds,
      direction: this.direction,
      speed: this.options.speed,
    };
  }

  public cancelActive(): void {
    this.activeRemainingSeconds = 0;
  }

  public reset(): void {
    this.activeRemainingSeconds = 0;
    this.cooldownRemainingSeconds = 0;
    this.direction.x = 0;
    this.direction.z = 1;
  }
}
