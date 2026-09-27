import { InputAction } from '../input/InputAction';
import type { InputManager } from '../input/InputManager';

interface StartMenuHandlers {
  readonly onNewGame: () => void;
  readonly onContinue: () => void;
  readonly onResetProgress: () => void;
}

export interface StartMenuState {
  readonly canContinue: boolean;
  readonly message?: string;
}

const EMPTY_HANDLERS: StartMenuHandlers = {
  onNewGame: () => undefined,
  onContinue: () => undefined,
  onResetProgress: () => undefined,
};

export class StartMenu {
  private readonly newGameButton: HTMLButtonElement;
  private readonly continueButton: HTMLButtonElement;
  private readonly resetButton: HTMLButtonElement;
  private readonly statusElement: HTMLElement;
  private handlers: StartMenuHandlers = EMPTY_HANDLERS;
  private canContinue = false;
  private busy = false;
  private stickLatched = false;

  public constructor(private readonly element: HTMLElement, private readonly input: InputManager) {
    const newGameButton = element.querySelector<HTMLButtonElement>('[data-start-new]');
    const continueButton = element.querySelector<HTMLButtonElement>('[data-start-continue]');
    const resetButton = element.querySelector<HTMLButtonElement>('[data-start-reset]');
    const statusElement = element.querySelector<HTMLElement>('[data-start-status]');
    if (
      newGameButton === null
      || continueButton === null
      || resetButton === null
      || statusElement === null
    ) {
      throw new Error('Start Menu is missing a required control.');
    }

    this.newGameButton = newGameButton;
    this.continueButton = continueButton;
    this.resetButton = resetButton;
    this.statusElement = statusElement;
    this.newGameButton.addEventListener('click', this.handleNewGame);
    this.continueButton.addEventListener('click', this.handleContinue);
    this.resetButton.addEventListener('click', this.handleReset);
  }

  public setHandlers(handlers: StartMenuHandlers): void {
    this.handlers = handlers;
  }

  public show(state: StartMenuState): void {
    this.canContinue = state.canContinue;
    this.statusElement.textContent = state.message ?? '';
    this.element.hidden = false;
    this.refreshButtons();
    this.stickLatched = false;
    if (!this.busy) {
      this.newGameButton.focus();
    }
  }

  public hide(): void {
    this.element.hidden = true;
    this.stickLatched = false;
    this.statusElement.textContent = '';
  }

  public setBusy(busy: boolean): void {
    this.busy = busy;
    this.element.setAttribute('aria-busy', String(busy));
    this.refreshButtons();
  }

  public update(): void {
    if (this.element.hidden || this.busy) return;
    const y = this.input.getMovement().y;
    if (Math.abs(y) < 0.25) this.stickLatched = false;
    if (!this.stickLatched && Math.abs(y) >= 0.55) {
      const buttons = [this.newGameButton, this.continueButton, this.resetButton]
        .filter((button) => !button.hidden && !button.disabled);
      const current = buttons.indexOf(this.element.ownerDocument.activeElement as HTMLButtonElement);
      const next = Math.max(0, Math.min(buttons.length - 1, current + Math.sign(y)));
      buttons[next]?.focus();
      this.stickLatched = true;
    }
    if (this.input.consumeActionPress(InputAction.Interact)) {
      const focused = this.element.ownerDocument.activeElement;
      const button = [this.newGameButton, this.continueButton, this.resetButton]
        .find((candidate) => candidate === focused && !candidate.disabled && !candidate.hidden);
      button?.click();
    }
  }

  public dispose(): void {
    this.newGameButton.removeEventListener('click', this.handleNewGame);
    this.continueButton.removeEventListener('click', this.handleContinue);
    this.resetButton.removeEventListener('click', this.handleReset);
    this.handlers = EMPTY_HANDLERS;
  }

  private refreshButtons(): void {
    this.newGameButton.disabled = this.busy;
    this.continueButton.disabled = this.busy || !this.canContinue;
    this.resetButton.disabled = this.busy;
    this.resetButton.hidden = !this.canContinue;
  }

  private readonly handleNewGame = (): void => {
    if (!this.busy) {
      this.handlers.onNewGame();
    }
  };

  private readonly handleContinue = (): void => {
    if (!this.busy && this.canContinue) {
      this.handlers.onContinue();
    }
  };

  private readonly handleReset = (): void => {
    if (!this.busy && this.canContinue) {
      this.handlers.onResetProgress();
    }
  };
}
