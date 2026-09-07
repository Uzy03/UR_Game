import type { EventRunner } from '../events/EventRunner';
import type { InteractionSystem } from '../interaction/InteractionSystem';
import type { NPCController } from '../npc/NPCController';
import type { PhoneController } from '../phone/PhoneController';
import type { PhoneProgress } from '../phone/PhoneProgress';
import type { PlayerController } from '../player/PlayerController';
import type { SceneManager } from '../scene/SceneManager';
import type { StartMenu } from '../ui/StartMenu';
import type { CheckpointActions, CheckpointDefinition } from './CheckpointTypes';
import type { CheckpointRegistry } from './CheckpointRegistry';
import type { GameSaveStore } from './GameSaveStore';

interface GameProgressDependencies {
  readonly initialCheckpointId: string;
  readonly checkpoints: CheckpointRegistry;
  readonly saveStore: GameSaveStore;
  readonly sceneManager: SceneManager;
  readonly eventRunner: EventRunner;
  readonly phoneProgress: PhoneProgress;
  readonly phone: PhoneController;
  readonly player: PlayerController;
  readonly interaction: InteractionSystem;
  readonly npcs: ReadonlyMap<string, NPCController>;
  readonly menu: StartMenu;
  readonly focusTarget: HTMLElement;
}

export class GameProgressController implements CheckpointActions {
  private gameActive = false;
  private restoring = false;
  private continueDisabledForSession = false;
  private disposed = false;

  public constructor(private readonly dependencies: GameProgressDependencies) {
    dependencies.menu.setHandlers({
      onNewGame: this.startNewGame,
      onContinue: this.continueGame,
      onResetProgress: this.resetProgress,
    });
  }

  public get isGameActive(): boolean {
    return this.gameActive;
  }

  public boot(): void {
    if (this.disposed) {
      return;
    }
    this.cleanupAndLockWorld();
    this.showMenu();
  }

  public readonly startNewGame = (): void => {
    if (this.disposed || this.restoring) {
      return;
    }

    this.dependencies.saveStore.clear();
    this.dependencies.phoneProgress.reset();
    this.continueDisabledForSession = false;
    const checkpoint = this.dependencies.checkpoints.getCheckpoint(
      this.dependencies.initialCheckpointId,
    );
    if (checkpoint === undefined) {
      this.handleRestoreFailure(
        new Error(`Initial Checkpoint "${this.dependencies.initialCheckpointId}" is not registered.`),
      );
      return;
    }

    this.restoreCheckpoint(checkpoint, true);
  };

  public readonly continueGame = (): void => {
    if (this.disposed || this.restoring || this.continueDisabledForSession) {
      return;
    }

    const saveData = this.dependencies.saveStore.load();
    const checkpoint = saveData === null
      ? undefined
      : this.dependencies.checkpoints.getCheckpoint(saveData.checkpointId);
    if (checkpoint === undefined) {
      this.showMenu('The saved checkpoint is unavailable. Start a New Game instead.');
      return;
    }

    this.restoreCheckpoint(checkpoint, false);
  };

  public setCheckpoint(checkpointId: string): void {
    const checkpoint = this.dependencies.checkpoints.getCheckpoint(checkpointId);
    if (checkpoint === undefined) {
      throw new Error(`Checkpoint "${checkpointId}" is not registered.`);
    }

    this.dependencies.saveStore.save({ version: 1, checkpointId: checkpoint.id });
  }

  public readonly resetProgress = (): void => {
    if (this.disposed || this.restoring) {
      return;
    }

    this.dependencies.menu.setBusy(true);
    this.cleanupAndLockWorld();
    this.dependencies.saveStore.clear();
    this.dependencies.phoneProgress.reset();
    this.continueDisabledForSession = false;
    this.dependencies.menu.setBusy(false);
    this.showMenu('Progress reset. Choose New Game when you are ready.');
  };

  public dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.dependencies.menu.dispose();
  }

  private restoreCheckpoint(checkpoint: CheckpointDefinition, saveAfterRestore: boolean): void {
    this.restoring = true;
    this.dependencies.menu.setBusy(true);

    try {
      this.cleanupAndLockWorld();
      this.dependencies.sceneManager.loadScene(checkpoint.sceneId);

      // A newly installed scene contains fresh NPCs, so the restore lock must be reapplied.
      this.setWorldEnabled(false);
      this.dependencies.phoneProgress.replace(checkpoint.phoneProgress);

      this.gameActive = true;
      this.setWorldEnabled(true);
      if (
        checkpoint.resumeSequence !== null
        && !this.dependencies.eventRunner.start(checkpoint.resumeSequence)
      ) {
        throw new Error(
          `Resume sequence "${checkpoint.resumeSequence.id}" could not be started.`,
        );
      }

      if (saveAfterRestore) {
        this.setCheckpoint(checkpoint.id);
      }
      this.continueDisabledForSession = false;
      this.dependencies.menu.hide();
      this.dependencies.focusTarget.focus();
    } catch (error: unknown) {
      this.handleRestoreFailure(error);
    } finally {
      this.restoring = false;
      this.dependencies.menu.setBusy(false);
    }
  }

  private handleRestoreFailure(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[GameProgressController] Checkpoint restore failed: ${message}`, error);
    this.continueDisabledForSession = true;
    this.cleanupAndLockWorld();
    this.dependencies.menu.setBusy(false);
    this.showMenu('Continue could not be restored. Start a New Game instead.');
  }

  private cleanupAndLockWorld(): void {
    this.dependencies.eventRunner.reset();
    this.dependencies.phone.close();
    this.dependencies.interaction.reset();
    this.gameActive = false;
    this.setWorldEnabled(false);
  }

  private setWorldEnabled(enabled: boolean): void {
    this.dependencies.player.setMovementEnabled(enabled);
    this.dependencies.interaction.setEnabled(enabled);
    for (const npc of this.dependencies.npcs.values()) {
      npc.setInteractionEnabled(enabled);
    }
  }

  private showMenu(message?: string): void {
    const saveData = this.dependencies.saveStore.load();
    const canContinue = !this.continueDisabledForSession
      && saveData !== null
      && this.dependencies.checkpoints.getCheckpoint(saveData.checkpointId) !== undefined;
    this.dependencies.menu.show({ canContinue, message });
  }
}
