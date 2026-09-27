import { InputAction } from '../input/InputAction';

export class InteractionPrompt {
  public constructor(private readonly element: HTMLElement) {}

  public setLabel(label: string | null, action: InputAction = InputAction.Interact): void {
    if (label === null) {
      this.element.hidden = true;
      this.element.textContent = '';
      return;
    }

    this.element.textContent = `E / ${action === InputAction.Work ? '△' : '○'} : ${label}`;
    this.element.hidden = false;
  }
}
