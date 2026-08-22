import type { TaskResult } from '../task/Task';

export class ResultOverlay {
  private readonly titleElement: HTMLElement;
  private readonly retryElement: HTMLElement;

  public constructor(private readonly element: HTMLElement) {
    const titleElement = element.querySelector<HTMLElement>('[data-result-title]');
    const retryElement = element.querySelector<HTMLElement>('[data-result-retry]');
    if (titleElement === null || retryElement === null) {
      throw new Error('Result overlay is missing its title or retry hint.');
    }

    this.titleElement = titleElement;
    this.retryElement = retryElement;
  }

  public show(result: TaskResult): void {
    this.titleElement.textContent = result === 'succeeded' ? 'CLEAR!' : 'TIME UP!';
    this.retryElement.textContent = result === 'failed' ? 'R : Retry' : '';
    this.element.hidden = false;
  }

  public hide(): void {
    this.element.hidden = true;
    this.titleElement.textContent = '';
    this.retryElement.textContent = '';
  }
}
