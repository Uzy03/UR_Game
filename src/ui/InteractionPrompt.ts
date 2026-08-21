export class InteractionPrompt {
  public constructor(private readonly element: HTMLElement) {}

  public setLabel(label: string | null): void {
    if (label === null) {
      this.element.hidden = true;
      this.element.textContent = '';
      return;
    }

    this.element.textContent = `E / Space : ${label}`;
    this.element.hidden = false;
  }
}
