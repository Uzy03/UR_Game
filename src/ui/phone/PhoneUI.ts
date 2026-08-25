import type {
  PhoneMessageDefinition,
  PhonePhotoDefinition,
  PhoneProgressSnapshot,
  PhoneScreen,
  PhoneStoryCard,
  PhoneThreadDefinition,
} from '../../phone/PhoneTypes';

export interface PhoneMessageThreadView {
  readonly thread: PhoneThreadDefinition;
  readonly messages: readonly PhoneMessageDefinition[];
}

interface PhoneUIHandlers {
  readonly onBack: () => void;
  readonly onClose: () => void;
}

export class PhoneUI {
  private readonly shellElement: HTMLElement;
  private readonly backButton: HTMLButtonElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly titleElement: HTMLElement;
  private readonly screenElement: HTMLElement;
  private handlers: PhoneUIHandlers | null = null;

  public constructor(private readonly element: HTMLElement) {
    const shellElement = element.querySelector<HTMLElement>('.phone-shell');
    const backButton = element.querySelector<HTMLButtonElement>('[data-phone-back]');
    const closeButton = element.querySelector<HTMLButtonElement>('[data-phone-close]');
    const titleElement = element.querySelector<HTMLElement>('[data-phone-title]');
    const screenElement = element.querySelector<HTMLElement>('[data-phone-screen]');
    if (
      shellElement === null
      || backButton === null
      || closeButton === null
      || titleElement === null
      || screenElement === null
    ) {
      throw new Error('Phone UI is missing required elements.');
    }

    this.shellElement = shellElement;
    this.backButton = backButton;
    this.closeButton = closeButton;
    this.titleElement = titleElement;
    this.screenElement = screenElement;
    this.backButton.addEventListener('click', this.handleBack);
    this.closeButton.addEventListener('click', this.handleClose);
  }

  public setHandlers(handlers: PhoneUIHandlers): void {
    this.handlers = handlers;
  }

  public show(focusTarget?: HTMLElement): void {
    this.element.hidden = false;
    (focusTarget ?? this.closeButton).focus();
  }

  public hide(): void {
    this.element.hidden = true;
    this.clearScreen();
  }

  public renderHome(
    snapshot: PhoneProgressSnapshot,
    onMessages: () => void,
    onAlbum: () => void,
  ): void {
    this.prepareScreen('home', 'Phone');

    const dateLabel = this.createElement('p', 'phone-section-label', 'Date');
    const dateValue = this.createElement(
      'p',
      'phone-date',
      snapshot.storyDate ?? 'No current date',
    );
    const objectiveCard = this.createElement('section', 'phone-objective');
    objectiveCard.append(
      this.createElement('p', 'phone-section-label', 'Current Objective'),
      this.createElement(
        'p',
        'phone-objective-text',
        snapshot.currentObjective?.text ?? 'No current objective',
      ),
    );

    const appGrid = this.createElement('div', 'phone-app-grid');
    appGrid.append(
      this.createAppButton(
        'Messages',
        `${snapshot.unlockedMessageIds.length} unlocked`,
        onMessages,
      ),
      this.createAppButton(
        'Album',
        `${snapshot.unlockedPhotoIds.length} unlocked`,
        onAlbum,
      ),
    );
    this.screenElement.append(dateLabel, dateValue, objectiveCard, appGrid);
  }

  public renderMessages(threads: readonly PhoneMessageThreadView[]): void {
    this.prepareScreen('messages', 'Messages');
    if (threads.length === 0) {
      this.screenElement.append(
        this.createEmptyState('No messages yet', 'New messages will appear here.'),
      );
      return;
    }

    for (const { thread, messages } of threads) {
      const threadElement = this.createElement('section', 'phone-thread');
      threadElement.append(this.createElement('h2', 'phone-thread-title', thread.title));
      for (const message of messages) {
        const messageElement = this.createElement('article', 'phone-message');
        const meta = this.createElement('div', 'phone-message-meta');
        meta.append(
          this.createElement('strong', '', message.sender),
          this.createElement('time', '', message.timeLabel),
        );
        messageElement.append(
          meta,
          this.createElement('p', 'phone-message-text', message.text),
        );
        threadElement.append(messageElement);
      }
      this.screenElement.append(threadElement);
    }
  }

  public renderAlbum(photos: readonly PhonePhotoDefinition[]): void {
    this.prepareScreen('album', 'Album');
    if (photos.length === 0) {
      this.screenElement.append(
        this.createEmptyState('No photos yet', 'Unlocked memories will appear here.'),
      );
      return;
    }

    const grid = this.createElement('div', 'phone-photo-grid');
    for (const photo of photos) {
      const card = this.createElement('figure', 'phone-photo-card');
      const image = document.createElement('img');
      image.src = photo.src;
      image.alt = photo.alt;
      image.loading = 'lazy';
      const caption = document.createElement('figcaption');
      caption.append(
        this.createElement('strong', '', photo.caption),
        this.createElement('time', '', photo.date),
      );
      card.append(image, caption);
      grid.append(card);
    }
    this.screenElement.append(grid);
  }

  public renderStoryCard(
    card: PhoneStoryCard,
    onAction: () => void,
  ): HTMLButtonElement {
    this.prepareScreen('story', card.appLabel);

    const storyCard = this.createElement('article', 'phone-story-card');
    storyCard.append(
      this.createElement('p', 'phone-story-app-label', card.appLabel),
      this.createElement('h2', 'phone-story-title', card.title),
    );
    if (card.subtitle !== undefined) {
      storyCard.append(this.createElement('p', 'phone-story-subtitle', card.subtitle));
    }
    storyCard.append(this.createElement('p', 'phone-story-body', card.body));

    const actionButton = this.createElement('button', 'phone-story-action', card.actionLabel);
    actionButton.type = 'button';
    actionButton.addEventListener('click', () => {
      actionButton.disabled = true;
      onAction();
    }, { once: true });
    storyCard.append(actionButton);
    this.screenElement.append(storyCard);
    return actionButton;
  }

  public dispose(): void {
    this.backButton.removeEventListener('click', this.handleBack);
    this.closeButton.removeEventListener('click', this.handleClose);
    this.handlers = null;
    this.hide();
  }

  private prepareScreen(screen: PhoneScreen, title: string): void {
    this.clearScreen();
    this.titleElement.textContent = title;
    const backHidden = screen === 'home' || screen === 'story';
    const closeHidden = screen === 'story';
    this.backButton.disabled = backHidden;
    this.backButton.setAttribute('aria-hidden', String(backHidden));
    this.closeButton.disabled = closeHidden;
    this.closeButton.setAttribute('aria-hidden', String(closeHidden));
    this.shellElement.dataset.phoneScreenName = screen;
  }

  private clearScreen(): void {
    this.screenElement.replaceChildren();
  }

  private createAppButton(
    label: string,
    detail: string,
    onClick: () => void,
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'phone-app-button';
    button.append(
      this.createElement('strong', '', label),
      this.createElement('span', '', detail),
    );
    button.addEventListener('click', onClick, { once: true });
    return button;
  }

  private createEmptyState(title: string, detail: string): HTMLElement {
    const element = this.createElement('div', 'phone-empty-state');
    element.append(
      this.createElement('strong', '', title),
      this.createElement('p', '', detail),
    );
    return element;
  }

  private createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    className: string,
    text?: string,
  ): HTMLElementTagNameMap[K] {
    const element = document.createElement(tagName);
    if (className.length > 0) {
      element.className = className;
    }
    if (text !== undefined) {
      element.textContent = text;
    }
    return element;
  }

  private readonly handleBack = (): void => {
    this.handlers?.onBack();
  };

  private readonly handleClose = (): void => {
    this.handlers?.onClose();
  };
}
