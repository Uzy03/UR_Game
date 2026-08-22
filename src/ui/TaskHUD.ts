import type { Task } from '../task/Task';

export class TaskHUD {
  private readonly labelElement: HTMLElement;
  private readonly timerElement: HTMLElement;

  public constructor(private readonly element: HTMLElement) {
    const labelElement = element.querySelector<HTMLElement>('[data-task-label]');
    const timerElement = element.querySelector<HTMLElement>('[data-task-timer]');
    if (labelElement === null || timerElement === null) {
      throw new Error('Task HUD is missing its label or timer element.');
    }

    this.labelElement = labelElement;
    this.timerElement = timerElement;
  }

  public update(task: Task | null): void {
    if (task === null || task.state !== 'running') {
      this.hide();
      return;
    }

    this.labelElement.textContent = task.label;
    this.timerElement.textContent = task.remainingSeconds === null
      ? ''
      : `Remaining ${this.formatTime(task.remainingSeconds)}`;
    this.element.hidden = false;
  }

  public hide(): void {
    this.element.hidden = true;
    this.labelElement.textContent = '';
    this.timerElement.textContent = '';
  }

  private formatTime(seconds: number): string {
    const roundedSeconds = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(roundedSeconds / 60);
    const remainder = roundedSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  }
}
