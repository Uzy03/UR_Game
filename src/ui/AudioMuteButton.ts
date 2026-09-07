export class AudioMuteButton {
  private toggleHandler: (() => void) | null = null;

  public constructor(private readonly element: HTMLButtonElement) {
    element.addEventListener('click', this.handleClick);
  }

  public setToggleHandler(handler: (() => void) | null): void {
    this.toggleHandler = handler;
  }

  public setMuted(muted: boolean): void {
    this.element.textContent = muted ? 'Sound Off' : 'Sound On';
    this.element.setAttribute('aria-pressed', String(muted));
    this.element.setAttribute('aria-label', muted ? 'Turn sound on' : 'Turn sound off');
  }

  public dispose(): void {
    this.element.removeEventListener('click', this.handleClick);
    this.toggleHandler = null;
  }

  private readonly handleClick = (): void => {
    this.toggleHandler?.();
  };
}
