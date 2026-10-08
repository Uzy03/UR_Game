import type {
  PhoneMessageDefinition,
  PhonePhotoDefinition,
  PhoneProgressSnapshot,
  PhoneScreen,
  PhoneStoryCard,
  PhoneThreadDefinition,
} from '../../phone/PhoneTypes';
import type { MemoryEntry, ProfileView } from '../../phone/PhoneHubData';
import type { SettingsDataV1 } from '../../settings/SettingsStore';
import type { VolumeSetting } from '../../settings/SettingsController';

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
    (focusTarget ?? this.navigableControls()[0] ?? this.closeButton).focus();
  }

  public hide(): void {
    this.element.hidden = true;
    this.clearScreen();
  }

  public renderHome(
    snapshot: PhoneProgressSnapshot,
    onMessages: () => void,
    onAlbum: () => void,
    onMemories: () => void,
    onProfile: () => void,
    onSettings: () => void,
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
      this.createAppButton('Memories', 'Cleared places', onMemories),
      this.createAppButton('Profile', 'Your journey', onProfile),
      this.createAppButton('Settings', 'Sound & system', onSettings),
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

  public renderMemories(entries: readonly MemoryEntry[], replay?: {
    readonly onReplay: (nodeId: string) => void;
    readonly activeLabel: string | null;
    readonly onExit: () => void;
    readonly error: string | null;
  }): void {
    this.prepareScreen('memories', 'Memories');
    if (replay?.error) {
      const error = this.createElement('p', 'phone-confirm-text', replay.error);
      error.setAttribute('role', 'alert');
      this.screenElement.append(error);
    }
    if (replay?.activeLabel) {
      this.screenElement.append(this.createElement('p', 'phone-section-label', `Replaying ${replay.activeLabel}`));
      const exit = this.createElement('button', 'phone-system-button', 'Exit Replay');
      exit.type = 'button';
      exit.addEventListener('click', replay.onExit);
      this.screenElement.append(exit);
    }
    if (entries.length === 0) {
      this.screenElement.append(this.createEmptyState('No cleared places yet', 'Keep exploring.'));
      return;
    }
    for (const entry of entries) {
      const row = this.createElement('article', 'phone-memory-row');
      row.append(
        this.createElement('strong', '', entry.routeLabel),
        this.createElement('span', '', entry.stageLabel),
        this.createElement('small', '', entry.state),
      );
      if (replay !== undefined) {
        const button = this.createElement('button', 'phone-system-button', `Replay ${entry.routeLabel}`);
        button.type = 'button';
        button.disabled = replay.activeLabel !== null;
        button.addEventListener('click', () => replay.onReplay(entry.id));
        row.append(button);
      }
      this.screenElement.append(row);
    }
  }

  public renderProfile(profile: ProfileView): void {
    this.prepareScreen('profile', 'Profile');
    const card = this.createElement('article', 'phone-profile-card');
    card.append(this.createElement('h2', '', profile.name));
    for (const [label, value] of [
      ['Story date', profile.storyDate],
      ['Current objective', profile.objective],
      ['Cleared routes', String(profile.completedRouteCount)],
      ['Messages', String(profile.unlockedMessageCount)],
      ['Photos', String(profile.unlockedPhotoCount)],
    ]) {
      const row = this.createElement('div', 'phone-profile-row');
      row.append(this.createElement('span', '', label), this.createElement('strong', '', value));
      card.append(row);
    }
    this.screenElement.append(card);
  }

  public renderSettings(
    settings: SettingsDataV1,
    onVolume: (key: VolumeSetting, value: number) => void,
    onMute: () => void,
    onReturnTitle: () => void,
  ): void {
    this.prepareScreen('settings', 'Settings');
    for (const [key, label] of [
      ['masterVolume', 'Master Volume'],
      ['bgmVolume', 'BGM Volume'],
      ['sfxVolume', 'SFX Volume'],
    ] as const) {
      const row = this.createElement('label', 'phone-setting-row');
      row.append(this.createElement('span', '', label));
      const value = this.createElement('strong', 'phone-setting-value');
      const slider = this.createElement('input', 'phone-setting-slider');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '1';
      slider.step = '0.05';
      slider.dataset.settingKey = key;
      slider.addEventListener('input', () => onVolume(key, Number(slider.value)));
      row.append(value, slider);
      this.screenElement.append(row);
    }
    const mute = this.createElement('button', 'phone-system-button');
    mute.type = 'button';
    mute.dataset.settingMute = 'true';
    mute.addEventListener('click', onMute);
    const returnButton = this.createElement('button', 'phone-system-button phone-system-danger', 'Return to Title');
    returnButton.type = 'button';
    returnButton.addEventListener('click', onReturnTitle);
    this.screenElement.append(mute, returnButton);
    this.updateSettings(settings);
  }

  public updateSettings(settings: SettingsDataV1): void {
    for (const key of ['masterVolume', 'bgmVolume', 'sfxVolume'] as const) {
      const slider = this.screenElement.querySelector<HTMLInputElement>(`[data-setting-key="${key}"]`);
      if (slider === null) continue;
      slider.value = String(settings[key]);
      const value = slider.parentElement?.querySelector<HTMLElement>('.phone-setting-value');
      if (value !== null && value !== undefined) value.textContent = `${Math.round(settings[key] * 100)}%`;
    }
    const mute = this.screenElement.querySelector<HTMLButtonElement>('[data-setting-mute]');
    if (mute !== null) mute.textContent = settings.muted ? 'Sound: Off' : 'Sound: On';
  }

  public renderReturnConfirmation(onCancel: () => void, onConfirm: () => void): void {
    this.prepareScreen('return-confirm', 'Return to Title');
    this.screenElement.append(this.createElement(
      'p', 'phone-confirm-text', 'Return to the title? Your latest checkpoint remains saved.',
    ));
    const cancel = this.createElement('button', 'phone-system-button', 'Cancel');
    cancel.type = 'button';
    cancel.addEventListener('click', onCancel);
    const confirm = this.createElement('button', 'phone-system-button phone-system-danger', 'Return to Title');
    confirm.type = 'button';
    confirm.addEventListener('click', onConfirm);
    this.screenElement.append(cancel, confirm);
    cancel.focus();
  }

  public renderReplayConfirmation(entry: MemoryEntry, onCancel: () => void, onConfirm: () => void): void {
    this.prepareScreen('replay-confirm', `Replay ${entry.routeLabel}`);
    this.renderReplayActions(
      `${entry.stageLabel}. Replay does not change campaign progress. Starting Replay leaves the current transient stage state. After Replay, you return to your latest saved campaign checkpoint.`,
      'Start Replay', onCancel, onConfirm,
    );
  }

  public renderExitReplayConfirmation(onCancel: () => void, onConfirm: () => void): void {
    this.prepareScreen('exit-replay-confirm', 'Exit Replay');
    this.renderReplayActions('Leave Replay and return to your saved campaign checkpoint? Campaign progress stays unchanged.',
      'Exit Replay', onCancel, onConfirm);
  }

  private renderReplayActions(text: string, label: string, onCancel: () => void, onConfirm: () => void): void {
    this.screenElement.append(this.createElement('p', 'phone-confirm-text', text));
    const cancel = this.createElement('button', 'phone-system-button', 'Cancel');
    cancel.type = 'button';
    cancel.addEventListener('click', onCancel);
    const confirm = this.createElement('button', 'phone-system-button', label);
    confirm.type = 'button';
    confirm.addEventListener('click', onConfirm);
    this.screenElement.append(cancel, confirm);
    cancel.focus();
  }

  public moveFocus(direction: 'up' | 'down' | 'left' | 'right'): void {
    const controls = this.navigableControls();
    if (controls.length === 0) {
      this.screenElement.scrollBy({ top: direction === 'up' ? -70 : 70 });
      return;
    }
    const current = controls.indexOf(document.activeElement as HTMLElement);
    const columns = this.shellElement.dataset.phoneScreenName === 'home' ? 2 : 1;
    const step = direction === 'up' ? -columns
      : direction === 'down' ? columns
        : direction === 'left' ? -1 : 1;
    const next = Math.max(0, Math.min(controls.length - 1, (current < 0 ? 0 : current) + step));
    controls[next]?.focus();
  }

  public adjustFocusedSlider(direction: -1 | 1): boolean {
    const focused = document.activeElement;
    if (!(focused instanceof HTMLInputElement) || focused.type !== 'range'
      || !this.screenElement.contains(focused)) return false;
    const value = Math.max(0, Math.min(1, Math.round((Number(focused.value) + direction * 0.05) * 20) / 20));
    focused.value = String(value);
    focused.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }

  public activateFocused(): void {
    const focused = document.activeElement;
    if (focused instanceof HTMLButtonElement && this.screenElement.contains(focused)
      && !focused.disabled) focused.click();
  }

  public focusDefault(): void {
    (this.navigableControls()[0] ?? this.closeButton).focus();
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
    storyCard.append(actionButton, this.createElement('p', 'phone-section-label', 'E / ○ : Continue'));
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

  private navigableControls(): HTMLElement[] {
    return [...this.screenElement.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button, input')]
      .filter((control) => !control.disabled && !control.hidden && control.closest('[hidden]') === null);
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
