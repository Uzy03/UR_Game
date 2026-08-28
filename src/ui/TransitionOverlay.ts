import type { TransitionActions } from '../events/TransitionActions';
import type { TransitionCardDefinition } from '../events/EventTypes';

export class TransitionOverlay implements TransitionActions {
  private readonly eyebrowElement: HTMLElement;
  private readonly titleElement: HTMLElement;
  private readonly subtitleElement: HTMLElement;

  public constructor(private readonly element: HTMLElement) {
    const eyebrowElement = element.querySelector<HTMLElement>('[data-transition-eyebrow]');
    const titleElement = element.querySelector<HTMLElement>('[data-transition-title]');
    const subtitleElement = element.querySelector<HTMLElement>('[data-transition-subtitle]');
    if (eyebrowElement === null || titleElement === null || subtitleElement === null) {
      throw new Error('Transition overlay is missing required text elements.');
    }

    this.eyebrowElement = eyebrowElement;
    this.titleElement = titleElement;
    this.subtitleElement = subtitleElement;
    this.hide();
  }

  public show(card: TransitionCardDefinition): void {
    this.setOptionalText(this.eyebrowElement, card.eyebrow);
    this.titleElement.textContent = card.title;
    this.setOptionalText(this.subtitleElement, card.subtitle);
    this.element.style.setProperty('--transition-card-duration', `${card.durationSeconds}s`);

    // Removing the animation class before layout guarantees repeated cards restart their CSS cycle.
    this.element.classList.remove('is-active');
    this.element.hidden = false;
    this.element.setAttribute('aria-hidden', 'false');
    void this.element.offsetWidth;
    this.element.classList.add('is-active');
  }

  public hide(): void {
    this.element.classList.remove('is-active');
    this.element.hidden = true;
    this.element.setAttribute('aria-hidden', 'true');
    this.element.style.removeProperty('--transition-card-duration');
    this.eyebrowElement.textContent = '';
    this.eyebrowElement.hidden = true;
    this.titleElement.textContent = '';
    this.subtitleElement.textContent = '';
    this.subtitleElement.hidden = true;
  }

  private setOptionalText(element: HTMLElement, text: string | undefined): void {
    element.textContent = text ?? '';
    element.hidden = text === undefined;
  }
}
