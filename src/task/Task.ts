export type TaskState = 'idle' | 'running' | 'succeeded' | 'failed';
export type TaskResult = Extract<TaskState, 'succeeded' | 'failed'>;

export interface Task {
  readonly id: string;
  readonly label: string;
  readonly state: TaskState;
  readonly remainingSeconds: number | null;
  start(): void;
  update(deltaSeconds: number): void;
  reset(): void;
}
