import type { PlacePoint } from '../interaction/PlacePoint';
import type { CountdownTimer } from './CountdownTimer';
import type { Task, TaskState } from './Task';

interface PlacementTaskOptions {
  readonly id: string;
  readonly label: string;
  readonly requiredItemIds: readonly string[];
  readonly targetPlacePoints: readonly PlacePoint[];
  readonly durationSeconds: number;
}

export class PlacementTask implements Task {
  public readonly id: string;
  public readonly label: string;
  private readonly requiredItemIds: ReadonlySet<string>;
  private taskState: TaskState = 'idle';

  public constructor(
    private readonly timer: CountdownTimer,
    private readonly options: PlacementTaskOptions,
  ) {
    this.id = options.id;
    this.label = options.label;
    this.requiredItemIds = new Set(options.requiredItemIds);
  }

  public get state(): TaskState {
    return this.taskState;
  }

  public get remainingSeconds(): number {
    return this.timer.remainingSeconds;
  }

  public start(): void {
    this.taskState = 'running';
    this.timer.start(this.options.durationSeconds);
  }

  public update(deltaSeconds: number): void {
    if (this.taskState !== 'running') {
      return;
    }

    if (this.isPlacementComplete()) {
      this.taskState = 'succeeded';
      this.timer.stop();
      return;
    }

    this.timer.update(deltaSeconds);
    if (this.timer.isExpired) {
      this.taskState = 'failed';
      this.timer.stop();
    }
  }

  public reset(): void {
    this.taskState = 'idle';
    this.timer.reset();
  }

  private isPlacementComplete(): boolean {
    if (this.requiredItemIds.size === 0) {
      return true;
    }

    const placedItemIds = new Set<string>();
    for (const placePoint of this.options.targetPlacePoints) {
      const item = placePoint.currentItem;
      if (item !== null) {
        placedItemIds.add(item.id);
      }
    }

    for (const requiredId of this.requiredItemIds) {
      if (!placedItemIds.has(requiredId)) {
        return false;
      }
    }

    return true;
  }
}
