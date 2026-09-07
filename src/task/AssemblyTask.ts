import type { AssemblyStation } from '../interaction/AssemblyStation';
import type { CountdownTimer } from './CountdownTimer';
import type { Task, TaskState } from './Task';

interface AssemblyTaskOptions {
  readonly id: string;
  readonly label: string;
  readonly stations: readonly AssemblyStation[];
  readonly durationSeconds: number;
}

export class AssemblyTask implements Task {
  public readonly id: string;
  public readonly label: string;
  private taskState: TaskState = 'idle';

  public constructor(
    private readonly timer: CountdownTimer,
    private readonly options: AssemblyTaskOptions,
  ) {
    this.id = options.id;
    this.label = options.label;
  }

  public get state(): TaskState {
    return this.taskState;
  }

  public get remainingSeconds(): number {
    return this.timer.remainingSeconds;
  }

  public start(): void {
    this.taskState = 'running';
    for (const station of this.options.stations) {
      station.setAssemblyEnabled(true);
    }
    this.timer.start(this.options.durationSeconds);
  }

  public update(deltaSeconds: number): void {
    if (this.taskState !== 'running') {
      return;
    }

    for (const station of this.options.stations) {
      station.update(deltaSeconds);
    }

    if (this.options.stations.every((station) => station.hasCompletedAssembly)) {
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
    for (const station of this.options.stations) {
      station.setAssemblyEnabled(false);
    }
  }
}
