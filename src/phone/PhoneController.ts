import { InputAction } from '../input/InputAction';
import type { InputManager } from '../input/InputManager';
import type { InteractionSystem } from '../interaction/InteractionSystem';
import type { PlayerController } from '../player/PlayerController';
import type { PhoneMessageThreadView, PhoneUI } from '../ui/phone/PhoneUI';
import type { PhoneContentRegistry } from './PhoneContentRegistry';
import type { PhoneProgress } from './PhoneProgress';
import type {
  PhoneMessageDefinition,
  PhonePhotoDefinition,
  PhoneScreen,
} from './PhoneTypes';

interface PhoneControllerOptions {
  readonly input: InputManager;
  readonly player: PlayerController;
  readonly interaction: InteractionSystem;
  readonly progress: PhoneProgress;
  readonly content: PhoneContentRegistry;
  readonly ui: PhoneUI;
  readonly canOpen: () => boolean;
  readonly focusTarget: HTMLElement;
}

export class PhoneController {
  private screen: PhoneScreen = 'home';
  private openState = false;
  private savedMovementEnabled: boolean | null = null;
  private savedInteractionEnabled: boolean | null = null;

  public constructor(private readonly options: PhoneControllerOptions) {
    options.ui.setHandlers({
      onBack: this.back,
      onClose: this.close,
    });
    options.ui.hide();
  }

  public get isOpen(): boolean {
    return this.openState;
  }

  public update(): void {
    if (this.options.input.consumeActionPress(InputAction.Phone)) {
      if (this.openState) {
        this.close();
      } else {
        this.open();
      }
      return;
    }

    if (this.openState && this.options.input.consumeActionPress(InputAction.Back)) {
      this.back();
    }
  }

  public open(): boolean {
    if (this.openState || !this.options.canOpen()) {
      return false;
    }

    this.savedMovementEnabled = this.options.player.isMovementEnabled;
    this.savedInteractionEnabled = this.options.interaction.isInteractionEnabled;
    this.options.player.setMovementEnabled(false);
    this.options.interaction.setEnabled(false);
    this.openState = true;
    this.screen = 'home';
    this.renderCurrentScreen();
    this.options.ui.show();
    return true;
  }

  public readonly close = (): void => {
    if (!this.openState) {
      return;
    }

    this.options.ui.hide();
    this.openState = false;
    if (this.savedMovementEnabled !== null) {
      this.options.player.setMovementEnabled(this.savedMovementEnabled);
    }
    if (this.savedInteractionEnabled !== null) {
      this.options.interaction.setEnabled(this.savedInteractionEnabled);
    }
    this.savedMovementEnabled = null;
    this.savedInteractionEnabled = null;
    this.options.focusTarget.focus();
  };

  public readonly back = (): void => {
    if (!this.openState) {
      return;
    }
    if (this.screen === 'home') {
      this.close();
      return;
    }

    this.screen = 'home';
    this.renderCurrentScreen();
  };

  public dispose(): void {
    this.close();
    this.options.ui.dispose();
  }

  private readonly showMessages = (): void => {
    if (!this.openState) {
      return;
    }
    this.screen = 'messages';
    this.renderCurrentScreen();
  };

  private readonly showAlbum = (): void => {
    if (!this.openState) {
      return;
    }
    this.screen = 'album';
    this.renderCurrentScreen();
  };

  private renderCurrentScreen(): void {
    const snapshot = this.options.progress.snapshot;
    switch (this.screen) {
      case 'home':
        this.options.ui.renderHome(snapshot, this.showMessages, this.showAlbum);
        break;
      case 'messages':
        this.options.ui.renderMessages(this.resolveMessageThreads(snapshot.unlockedMessageIds));
        break;
      case 'album':
        this.options.ui.renderAlbum(this.resolvePhotos(snapshot.unlockedPhotoIds));
        break;
    }
  }

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
