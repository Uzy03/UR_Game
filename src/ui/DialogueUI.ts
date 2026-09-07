import type { DialogueLine } from '../dialogue/DialogueTypes';

export class DialogueUI {
  private readonly speakerElement: HTMLElement;
  private readonly textElement: HTMLElement;

  public constructor(private readonly element: HTMLElement) {
    const speakerElement = element.querySelector<HTMLElement>('[data-dialogue-speaker]');
    const textElement = element.querySelector<HTMLElement>('[data-dialogue-text]');
    if (speakerElement === null || textElement === null) {
      throw new Error('Dialogue UI is missing its speaker or text element.');
    }

    this.speakerElement = speakerElement;
    this.textElement = textElement;
  }

  public show(line: DialogueLine): void {
    this.speakerElement.textContent = line.speaker;
    this.textElement.textContent = line.text;
    this.element.hidden = false;
  }

  public hide(): void {
    this.element.hidden = true;
    this.speakerElement.textContent = '';
    this.textElement.textContent = '';
  }
}
