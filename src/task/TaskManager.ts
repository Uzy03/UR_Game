import type { Task, TaskResult } from './Task';

export type TaskFinishedHandler = (task: Task, result: TaskResult) => void;

export class TaskManager {
  private activeTask: Task | null = null;
  private completionNotified = false;
  private finishedHandler: TaskFinishedHandler | null = null;

  public get currentTask(): Task | null {
    return this.activeTask;
  }

  public setFinishedHandler(handler: TaskFinishedHandler | null): void {
    this.finishedHandler = handler;
  }

  public start(task: Task): void {
    if (this.activeTask !== null && this.activeTask !== task) {
      this.activeTask.reset();
    }

    this.activeTask = task;
    this.completionNotified = false;
    task.start();
  }

  public update(deltaSeconds: number): void {
    if (this.activeTask === null || this.completionNotified) {
      return;
    }

    this.activeTask.update(deltaSeconds);
    if (this.activeTask.state === 'succeeded' || this.activeTask.state === 'failed') {
      this.completionNotified = true;
      this.finishedHandler?.(this.activeTask, this.activeTask.state);
    }
  }

  public reset(): void {
    this.activeTask?.reset();
    this.activeTask = null;
    this.completionNotified = false;
  }
}
