import type { Task } from '../task/Task';

export interface TaskEventBinding {
  readonly task: Task;
  prepareAttempt(): void;
}
