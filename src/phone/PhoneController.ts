import { InputAction } from '../input/InputAction';
import type { InputManager } from '../input/InputManager';
import type { ReplayActions } from '../replay/ReplayController';
import type { SettingsController, VolumeSetting } from '../settings/SettingsController';
import type { PhoneMessageThreadView, PhoneUI } from '../ui/phone/PhoneUI';
import type { WorldProgress } from '../world/WorldProgress';
import type { WorldRoute } from '../world/WorldRoute';
import type { PhoneContentRegistry } from './PhoneContentRegistry';
import { clearedMemories, profileView } from './PhoneHubData';
import type { PhoneProgress } from './PhoneProgress';
import type {
  PhoneMessageDefinition,
  PhonePhotoDefinition,
  PhoneScreen,
  PhoneStoryActions,
  PhoneStoryCard,
} from './PhoneTypes';

interface PhoneControllerOptions {
  readonly input: InputManager;
  readonly progress: PhoneProgress;
  readonly content: PhoneContentRegistry;
  readonly route: WorldRoute;
  readonly worldProgress: WorldProgress;
  readonly settings: SettingsController;
  readonly ui: PhoneUI;
  readonly canOpen: () => boolean;
  readonly returnToTitle: () => void;
  readonly focusTarget: HTMLElement;
  readonly replay?: ReplayActions;
}

type NormalPhoneScreen = Exclude<PhoneScreen, 'story'>;
type PhonePresentationMode = 'closed' | 'normal' | 'story';

export class PhoneController implements PhoneStoryActions {
  private screen: NormalPhoneScreen = 'home';
  private mode: PhonePresentationMode = 'closed';
  private navigationLatched = false;
  private closedThisFrame = false;
  private replayNodeId: string | null = null;
  private replayError: string | null = null;
  private readonly unsubscribeSettings: () => void;
  private storyCompletedHandler: (() => void) | null = null;

  public constructor(private readonly options: PhoneControllerOptions) {
    options.ui.setHandlers({
      onBack: this.back,
      onClose: this.close,
    });
    options.ui.hide();
    this.unsubscribeSettings = options.settings.subscribe((settings) => {
      if (this.mode === 'normal' && this.screen === 'settings') {
        options.ui.updateSettings(settings);
      }
    });
  }

  public get isOpen(): boolean {
    return this.mode !== 'closed';
  }

  public get isStoryPresenting(): boolean {
    return this.mode === 'story';
  }

  public get isNormalOpen(): boolean { return this.mode === 'normal'; }

  public consumeSimulationGate(): boolean {
    const gate = this.mode === 'normal' || this.closedThisFrame;
    this.closedThisFrame = false;
    return gate;
  }

  public update(): void {
    if (this.mode === 'story' && this.options.input.consumeActionPress(InputAction.Interact)) {
      this.completeStoryPresentation();
      return;
    }
    if (this.options.input.consumeActionPress(InputAction.Phone)) {
      if (this.mode === 'story') {
        return;
      }
      if (this.mode === 'normal') {
        this.close();
      } else {
        this.open();
      }
      return;
    }

    if (this.mode !== 'normal') return;
    if (this.options.input.consumeActionPress(InputAction.Back)) {
      this.back();
      return;
    }
    if (this.options.input.consumeActionPress(InputAction.Interact)) {
      this.options.ui.activateFocused();
      return;
    }
    const movement = this.options.input.getMovement();
    if (Math.hypot(movement.x, movement.y) < 0.25) this.navigationLatched = false;
    if (this.navigationLatched || Math.max(Math.abs(movement.x), Math.abs(movement.y)) < 0.55) return;
    this.navigationLatched = true;
    if (Math.abs(movement.x) > Math.abs(movement.y)) {
      const direction = movement.x < 0 ? -1 : 1;
      if (!this.options.ui.adjustFocusedSlider(direction)) {
        this.options.ui.moveFocus(direction < 0 ? 'left' : 'right');
      }
    } else {
      this.options.ui.moveFocus(movement.y < 0 ? 'up' : 'down');
    }
  }

  public open(): boolean {
    if (this.mode !== 'closed' || !this.options.canOpen()) {
      return false;
    }

    this.mode = 'normal';
    this.screen = 'home';
    this.navigationLatched = true;
    this.renderCurrentScreen();
    this.options.ui.show();
    return true;
  }

  public readonly close = (): void => {
    if (this.mode !== 'normal') {
      return;
    }

    this.options.ui.hide();
    this.mode = 'closed';
    this.closedThisFrame = true;
    this.navigationLatched = false;
    this.options.focusTarget.focus();
  };

  public readonly back = (): void => {
    if (this.mode !== 'normal') {
      return;
    }
    if (this.screen === 'home') {
      this.close();
      return;
    }

    this.screen = this.screen === 'return-confirm' ? 'settings'
      : this.screen === 'replay-confirm' || this.screen === 'exit-replay-confirm' ? 'memories' : 'home';
    this.renderCurrentScreen();
    this.navigationLatched = true;
    this.options.ui.focusDefault();
  };

  public presentStoryCard(card: PhoneStoryCard, onComplete: () => void): boolean {
    if (this.mode !== 'closed') {
      return false;
    }

    this.mode = 'story';
    this.storyCompletedHandler = onComplete;
    try {
      const actionButton = this.options.ui.renderStoryCard(
        card,
        this.completeStoryPresentation,
      );
      this.options.ui.show(actionButton);
      return true;
    } catch (error: unknown) {
      this.storyCompletedHandler = null;
      this.mode = 'closed';
      this.options.ui.hide();
      throw error;
    }
  }

  public cancelStoryPresentation(): void {
    if (this.mode !== 'story') {
      return;
    }

    this.storyCompletedHandler = null;
    this.mode = 'closed';
    this.options.ui.hide();
    this.options.focusTarget.focus();
  }

  public dispose(): void {
    this.cancelStoryPresentation();
    this.close();
    this.unsubscribeSettings();
    this.options.ui.dispose();
  }

  private readonly showMessages = (): void => {
    if (this.mode !== 'normal') {
      return;
    }
    this.screen = 'messages';
    this.renderCurrentScreen();
    this.navigationLatched = true;
    this.options.ui.focusDefault();
  };

  private readonly showAlbum = (): void => {
    if (this.mode !== 'normal') {
      return;
    }
    this.screen = 'album';
    this.renderCurrentScreen();
    this.navigationLatched = true;
    this.options.ui.focusDefault();
  };

  private readonly showMemories = (): void => this.showScreen('memories');
  private readonly showProfile = (): void => this.showScreen('profile');
  private readonly showSettings = (): void => this.showScreen('settings');
  private readonly showReturnConfirmation = (): void => this.showScreen('return-confirm');

  private readonly selectReplay = (nodeId: string): void => {
    if (!clearedMemories(this.options.route, this.options.worldProgress).some((entry) => entry.id === nodeId)
      || this.options.replay?.activeNode) return;
    this.replayNodeId = nodeId;
    this.replayError = null;
    this.showScreen('replay-confirm');
  };

  private readonly startReplay = (): void => {
    if (this.replayNodeId === null || this.options.replay === undefined) return;
    const error = this.options.replay.start(this.replayNodeId);
    if (error === null) return;
    this.replayError = error;
    if (this.mode === 'closed') this.open();
    this.showScreen('memories');
  };

  private readonly exitReplay = (): void => { this.options.replay?.exit(); };

  private showScreen(screen: NormalPhoneScreen): void {
    if (this.mode !== 'normal') return;
    this.screen = screen;
    this.navigationLatched = true;
    this.renderCurrentScreen();
    this.options.ui.focusDefault();
  }

  private readonly changeVolume = (key: VolumeSetting, value: number): void => {
    this.options.settings.setVolume(key, value);
  };

  private readonly toggleMute = (): void => {
    this.options.settings.setMuted(!this.options.settings.snapshot.muted);
  };

  private readonly returnToTitle = (): void => {
    this.options.returnToTitle();
  };

  private renderCurrentScreen(): void {
    const snapshot = this.options.progress.snapshot;
    switch (this.screen) {
      case 'home':
        this.options.ui.renderHome(
          snapshot, this.showMessages, this.showAlbum,
          this.showMemories, this.showProfile, this.showSettings,
        );
        break;
      case 'messages':
        this.options.ui.renderMessages(this.resolveMessageThreads(snapshot.unlockedMessageIds));
        break;
      case 'album':
        this.options.ui.renderAlbum(this.resolvePhotos(snapshot.unlockedPhotoIds));
        break;
      case 'memories':
        this.options.ui.renderMemories(clearedMemories(this.options.route, this.options.worldProgress),
          this.options.replay === undefined ? undefined : {
            onReplay: this.selectReplay,
            activeLabel: this.options.replay.activeNode === null ? null
              : `${this.options.replay.activeNode.label} · ${this.options.replay.activeNode.stageLabel}`,
            onExit: () => this.showScreen('exit-replay-confirm'),
            error: this.replayError,
          });
        break;
      case 'replay-confirm': {
        const entry = clearedMemories(this.options.route, this.options.worldProgress)
          .find(({ id }) => id === this.replayNodeId);
        if (entry === undefined) { this.showScreen('memories'); break; }
        this.options.ui.renderReplayConfirmation(entry, this.back, this.startReplay);
        break;
      }
      case 'exit-replay-confirm':
        this.options.ui.renderExitReplayConfirmation(this.back, this.exitReplay);
        break;
      case 'profile':
        this.options.ui.renderProfile(profileView(
          snapshot, this.options.worldProgress.completedNodeIds.length,
        ));
        break;
      case 'settings':
        this.options.ui.renderSettings(
          this.options.settings.snapshot,
          this.changeVolume,
          this.toggleMute,
          this.showReturnConfirmation,
        );
        break;
      case 'return-confirm':
        this.options.ui.renderReturnConfirmation(this.back, this.returnToTitle);
        break;
    }
  }

  private readonly completeStoryPresentation = (): void => {
    if (this.mode !== 'story') {
      return;
    }

    const completedHandler = this.storyCompletedHandler;
    this.storyCompletedHandler = null;
    this.mode = 'closed';
    this.options.ui.hide();
    this.options.focusTarget.focus();
    completedHandler?.();
  };

  private resolveMessageThreads(
    messageIds: readonly string[],
  ): readonly PhoneMessageThreadView[] {
    const messagesByThread = new Map<string, PhoneMessageDefinition[]>();
    for (const id of messageIds) {
      const message = this.options.content.getMessage(id);
      if (message === undefined) {
        continue;
      }
      const messages = messagesByThread.get(message.threadId) ?? [];
      messages.push(message);
      messagesByThread.set(message.threadId, messages);
    }

    const threads: PhoneMessageThreadView[] = [];
    for (const [threadId, messages] of messagesByThread) {
      const thread = this.options.content.getThread(threadId);
      if (thread !== undefined) {
        threads.push({ thread, messages });
      }
    }
    return threads;
  }

  private resolvePhotos(photoIds: readonly string[]): readonly PhonePhotoDefinition[] {
    const photos: PhonePhotoDefinition[] = [];
    for (const id of photoIds) {
      const photo = this.options.content.getPhoto(id);
      if (photo !== undefined) {
        photos.push(photo);
      }
    }
    return photos;
  }
}
