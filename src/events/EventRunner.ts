import type { AudioActions } from '../audio/AudioActions';
import type { AudioCue } from '../audio/AudioTypes';
import type { DialogueManager } from '../dialogue/DialogueManager';
import type { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import type { InteractionSystem } from '../interaction/InteractionSystem';
import type { NPCController } from '../npc/NPCController';
import type { PlayerController } from '../player/PlayerController';
import type { PhoneProgressActions, PhoneStoryActions } from '../phone/PhoneTypes';
import type { CheckpointActions } from '../save/CheckpointTypes';
import type { SceneActions } from '../scene/SceneManager';
import type { TaskResult } from '../task/Task';
import type { TaskManager } from '../task/TaskManager';
import type { ResultOverlay } from '../ui/ResultOverlay';
import type { SpeechBubble } from '../ui/SpeechBubble';
import type { TaskHUD } from '../ui/TaskHUD';
import type { EventSequence } from './EventTypes';
import type { TaskEventBinding } from './TaskEventBinding';
import type { TransitionActions } from './TransitionActions';
import { assertValidTransitionCardDefinition } from './TransitionCardValidation';

export type EventRunnerState = 'idle' | 'running' | 'completed' | 'cancelled' | 'error';

export interface EventRunnerErrorInfo {
  readonly sequenceId: string;
  readonly eventIndex: number;
  readonly eventType: string;
  readonly message: string;
}

interface EventRunnerDependencies {
  readonly input: InputManager;
  readonly player: PlayerController;
  readonly interaction: InteractionSystem;
  readonly dialogue: DialogueManager;
  readonly taskManager: TaskManager;
  readonly taskHud: TaskHUD;
  readonly resultOverlay: ResultOverlay;
  readonly speechBubble: SpeechBubble;
  readonly npcs: ReadonlyMap<string, NPCController>;
  readonly tasks: ReadonlyMap<string, TaskEventBinding>;
  readonly phoneProgress: PhoneProgressActions;
  readonly phoneStory: PhoneStoryActions;
  readonly scenes: SceneActions;
  readonly checkpoints: CheckpointActions;
  readonly transition: TransitionActions;
  readonly audio: AudioActions;
}

interface EventRunnerOptions {
  readonly successResultDurationSeconds: number;
}

type TaskEventPhase = 'none' | 'running' | 'failed' | 'success-delay';

export class EventRunner {
  private runnerState: EventRunnerState = 'idle';
  private sequence: EventSequence | null = null;
  private eventIndex = 0;
  private currentEventStarted = false;
  private waitRemainingSeconds = 0;
  private taskPhase: TaskEventPhase = 'none';
  private activeTaskBinding: TaskEventBinding | null = null;
  private activeNpc: NPCController | null = null;
  private transitionVisible = false;
  private savedPlayerMovementEnabled: boolean | null = null;
  private savedInteractionEnabled: boolean | null = null;
  private readonly savedNpcInteractionStates = new Map<NPCController, boolean>();
  private completedHandler: ((sequenceId: string) => void) | null = null;
  private disposed = false;
  public lastError: EventRunnerErrorInfo | null = null;

  public constructor(
    private readonly dependencies: EventRunnerDependencies,
    private readonly options: EventRunnerOptions,
  ) {
    if (!this.isValidDuration(options.successResultDurationSeconds)) {
      throw new Error('Success result duration must be a finite non-negative number.');
    }
    dependencies.taskManager.setFinishedHandler(this.handleTaskFinished);
  }

  public get state(): EventRunnerState {
    return this.runnerState;
  }

  public get currentSequenceId(): string | null {
    return this.sequence?.id ?? null;
  }

  public get currentEventIndex(): number | null {
    return this.sequence === null ? null : this.eventIndex;
  }

  public setCompletedHandler(handler: ((sequenceId: string) => void) | null): void {
    this.completedHandler = handler;
  }

  public start(sequence: EventSequence): boolean {
    if (this.disposed || this.runnerState === 'running') {
      return false;
    }

    this.sequence = sequence;
    this.eventIndex = 0;
    this.currentEventStarted = false;
    this.waitRemainingSeconds = 0;
    this.taskPhase = 'none';
    this.activeTaskBinding = null;
    this.activeNpc = null;
    this.lastError = null;
    this.runnerState = 'running';
    this.savedNpcInteractionStates.clear();
    this.disableCurrentNpcInteractionsPreservingSavedState();
    this.captureControls();
    this.setGameplayEnabled(false);

    if (sequence.events.length === 0) {
      this.completeSequence();
    }

    return true;
  }

  public update(deltaSeconds: number): void {
    if (this.runnerState !== 'running' || this.sequence === null) {
      return;
    }

    if (!this.currentEventStarted) {
      this.beginCurrentEvent();
      if (this.runnerState !== 'running' || !this.currentEventStarted) {
        return;
      }
    }

    const event = this.sequence.events[this.eventIndex];
    if (event === undefined) {
      this.completeSequence();
      return;
    }

    const safeDeltaSeconds = Number.isFinite(deltaSeconds) && deltaSeconds > 0
      ? deltaSeconds
      : 0;

    switch (event.type) {
      case 'dialogue':
        this.dependencies.dialogue.update(
          this.dependencies.input.consumeActionPress(InputAction.Interact),
        );
        break;
      case 'move_npc':
        if (this.activeNpc !== null && !this.activeNpc.isMoving) {
          this.completeCurrentEvent();
        }
        break;
      case 'wait':
        this.waitRemainingSeconds = Math.max(
          0,
          this.waitRemainingSeconds - safeDeltaSeconds,
        );
        if (this.waitRemainingSeconds === 0) {
          this.completeCurrentEvent();
        }
        break;
      case 'task':
        this.updateTaskEvent(safeDeltaSeconds);
        break;
      case 'speech':
        // Speech events complete during beginCurrentEvent().
        break;
      case 'set_date':
      case 'set_objective':
      case 'unlock_message':
      case 'unlock_photo':
      case 'change_scene':
      case 'set_checkpoint':
      case 'audio_cue':
        // Synchronous service events complete during beginCurrentEvent().
        break;
      case 'phone_story':
        // Story cards complete through their guarded UI callback.
        break;
      case 'transition_card':
        this.waitRemainingSeconds = Math.max(
          0,
          this.waitRemainingSeconds - safeDeltaSeconds,
        );
        if (this.waitRemainingSeconds === 0) {
          this.completeCurrentEvent();
        }
        break;
    }
  }

  public cancel(): void {
    if (this.runnerState === 'running') {
      this.cleanupRuntime();
    }
    this.runnerState = 'cancelled';
    this.currentEventStarted = false;
  }

  public reset(): void {
    if (this.runnerState === 'running') {
      this.cleanupRuntime();
    } else {
      this.clearUiAndTaskState();
      this.restoreControlsAndNpcInteractions();
    }

    this.sequence = null;
    this.eventIndex = 0;
    this.currentEventStarted = false;
    this.waitRemainingSeconds = 0;
    this.taskPhase = 'none';
    this.activeTaskBinding = null;
    this.activeNpc = null;
    this.lastError = null;
    this.runnerState = 'idle';
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }

    if (this.runnerState === 'running') {
      this.cleanupRuntime();
    } else {
      this.clearUiAndTaskState();
      this.restoreControlsAndNpcInteractions();
    }
    this.dependencies.taskManager.setFinishedHandler(null);
    this.completedHandler = null;
    this.disposed = true;
  }

  private beginCurrentEvent(): void {
    if (this.sequence === null) {
      return;
    }

    const event = this.sequence.events[this.eventIndex];
    if (event === undefined) {
      this.completeSequence();
      return;
    }

    this.currentEventStarted = true;

    switch (event.type) {
      case 'dialogue': {
        this.setGameplayEnabled(false);
        const startedIndex = this.eventIndex;
        this.dependencies.dialogue.start(event.sequence, () => {
          if (
            this.runnerState === 'running'
            && this.eventIndex === startedIndex
            && this.currentEventStarted
          ) {
            this.completeCurrentEvent();
          }
        });
        break;
      }
      case 'move_npc': {
        if (!this.isFinitePosition(event.position)) {
          this.failCurrentEvent('NPC destination must contain finite coordinates.', event.type);
          return;
        }
        const npc = this.dependencies.npcs.get(event.npcId);
        if (npc === undefined) {
          this.failCurrentEvent(`NPC "${event.npcId}" is not registered.`, event.type);
          return;
        }
        this.setGameplayEnabled(false);
        this.activeNpc = npc;
        npc.moveTo(event.position);
        break;
      }
      case 'speech': {
        const npc = this.dependencies.npcs.get(event.npcId);
        if (npc === undefined) {
          this.failCurrentEvent(`NPC "${event.npcId}" is not registered.`, event.type);
          return;
        }
        if (!this.isValidDuration(event.durationSeconds)) {
          this.failCurrentEvent('Speech duration must be a finite non-negative number.', event.type);
          return;
        }
        this.setGameplayEnabled(false);
        this.dependencies.speechBubble.show(
          npc.speechAnchor,
          event.text,
          event.durationSeconds,
        );
        this.completeCurrentEvent();
        break;
      }
      case 'wait':
        if (!this.isValidDuration(event.durationSeconds)) {
          this.failCurrentEvent('Wait duration must be a finite non-negative number.', event.type);
          return;
        }
        this.setGameplayEnabled(false);
        this.waitRemainingSeconds = event.durationSeconds;
        if (this.waitRemainingSeconds === 0) {
          this.completeCurrentEvent();
        }
        break;
      case 'task': {
        const binding = this.dependencies.tasks.get(event.taskId);
        if (binding === undefined) {
          this.failCurrentEvent(`Task "${event.taskId}" is not registered.`, event.type);
          return;
        }
        this.activeTaskBinding = binding;
        this.startTaskAttempt(binding);
        break;
      }
      case 'set_date':
        this.runImmediateEvent(
          event.type,
          () => this.dependencies.phoneProgress.setStoryDate(event.date),
        );
        break;
      case 'set_objective':
        this.runImmediateEvent(
          event.type,
          () => this.dependencies.phoneProgress.setObjective(event.objective),
        );
        break;
      case 'unlock_message':
        this.runImmediateEvent(
          event.type,
          () => this.dependencies.phoneProgress.unlockMessage(event.messageId),
        );
        break;
      case 'unlock_photo':
        this.runImmediateEvent(
          event.type,
          () => this.dependencies.phoneProgress.unlockPhoto(event.photoId),
        );
        break;
      case 'change_scene':
        this.setGameplayEnabled(false);
        this.runImmediateEvent(event.type, () => {
          this.dependencies.scenes.loadScene(event.sceneId);
          this.disableCurrentNpcInteractionsPreservingSavedState();
        });
        break;
      case 'set_checkpoint':
        this.runImmediateEvent(
          event.type,
          () => this.dependencies.checkpoints.setCheckpoint(event.checkpointId),
        );
        break;
      case 'phone_story': {
        this.setGameplayEnabled(false);
        const startedIndex = this.eventIndex;
        let presented = false;
        try {
          presented = this.dependencies.phoneStory.presentStoryCard(event.card, () => {
            if (
              this.runnerState === 'running'
              && this.eventIndex === startedIndex
              && this.currentEventStarted
            ) {
              this.completeCurrentEvent();
            }
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          this.failCurrentEvent(message, event.type);
          return;
        }
        if (!presented) {
          this.failCurrentEvent('Phone Story presentation could not be started.', event.type);
        }
        break;
      }
      case 'transition_card': {
        this.setGameplayEnabled(false);
        try {
          assertValidTransitionCardDefinition(event.card, 'Transition Card');
          this.transitionVisible = true;
          this.dependencies.transition.show(event.card);
          this.waitRemainingSeconds = event.card.durationSeconds;
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          this.failCurrentEvent(message, event.type);
        }
        break;
      }
      case 'audio_cue':
        this.runImmediateEvent(event.type, () => this.dispatchAudioCue(event.cue));
        break;
      default: {
        const unsupported = event as { readonly type?: unknown };
        this.failCurrentEvent(
          `Unsupported event type "${String(unsupported.type)}".`,
          String(unsupported.type ?? 'unknown'),
        );
      }
    }
  }

  private updateTaskEvent(deltaSeconds: number): void {
    if (this.taskPhase === 'running') {
      this.dependencies.taskManager.update(deltaSeconds);
      this.dependencies.taskHud.update(this.dependencies.taskManager.currentTask);
      return;
    }

    if (this.taskPhase === 'failed') {
      if (this.dependencies.input.consumeActionPress(InputAction.Retry)) {
        const binding = this.activeTaskBinding;
        if (binding === null) {
          this.failCurrentEvent('The active task binding is missing.', 'task');
          return;
        }
        this.startTaskAttempt(binding);
      }
      return;
    }

    if (this.taskPhase === 'success-delay') {
      this.waitRemainingSeconds = Math.max(0, this.waitRemainingSeconds - deltaSeconds);
      if (this.waitRemainingSeconds === 0) {
        this.dependencies.resultOverlay.hide();
        this.completeCurrentEvent();
      }
    }
  }

  private runImmediateEvent(eventType: string, action: () => void): void {
    try {
      action();
      this.completeCurrentEvent();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.failCurrentEvent(message, eventType);
    }
  }

  private dispatchAudioCue(cue: AudioCue): void {
    switch (cue.kind) {
      case 'play_bgm':
        this.dependencies.audio.playBgm(cue.audioId, cue.fadeSeconds);
        break;
      case 'stop_bgm':
        this.dependencies.audio.stopBgm(cue.fadeSeconds);
        break;
      case 'play_sfx':
        this.dependencies.audio.playSfx(cue.audioId);
        break;
      default: {
        const unsupported = cue as { readonly kind?: unknown };
        throw new Error(`Unsupported Audio Cue kind "${String(unsupported.kind)}".`);
      }
    }
  }

  private startTaskAttempt(binding: TaskEventBinding): void {
    this.dependencies.taskManager.reset();
    binding.prepareAttempt();
    this.dependencies.resultOverlay.hide();
    this.dependencies.taskManager.start(binding.task);
    this.dependencies.taskHud.update(binding.task);
    this.taskPhase = 'running';
    this.waitRemainingSeconds = 0;
    this.setGameplayEnabled(true);
  }

  private readonly handleTaskFinished = (_task: TaskEventBinding['task'], result: TaskResult): void => {
    if (
      this.runnerState !== 'running'
      || this.sequence?.events[this.eventIndex]?.type !== 'task'
      || this.taskPhase !== 'running'
    ) {
      return;
    }

    this.dependencies.taskHud.hide();
    this.dependencies.resultOverlay.show(result);
    this.setGameplayEnabled(false);

    if (result === 'succeeded') {
      this.taskPhase = 'success-delay';
      this.waitRemainingSeconds = Math.max(0, this.options.successResultDurationSeconds);
      if (this.waitRemainingSeconds === 0) {
        this.dependencies.resultOverlay.hide();
        this.completeCurrentEvent();
      }
    } else {
      this.taskPhase = 'failed';
    }
  };

  private completeCurrentEvent(): void {
    const completedEvent = this.sequence?.events[this.eventIndex];
    if (completedEvent?.type === 'task') {
      this.dependencies.taskManager.reset();
      this.dependencies.taskHud.hide();
      this.dependencies.resultOverlay.hide();
    }
    if (completedEvent?.type === 'transition_card') {
      this.hideTransition();
    }

    this.currentEventStarted = false;
    this.waitRemainingSeconds = 0;
    this.taskPhase = 'none';
    this.activeTaskBinding = null;
    this.activeNpc = null;
    this.eventIndex += 1;

    if (this.sequence !== null && this.eventIndex >= this.sequence.events.length) {
      this.completeSequence();
    }
  }

  private completeSequence(): void {
    const sequenceId = this.sequence?.id ?? '';
    this.cleanupRuntime();
    this.runnerState = 'completed';
    this.completedHandler?.(sequenceId);
  }

  private failCurrentEvent(message: string, eventType: string): void {
    const info: EventRunnerErrorInfo = {
      sequenceId: this.sequence?.id ?? '',
      eventIndex: this.eventIndex,
      eventType,
      message,
    };
    this.lastError = info;
    console.error(
      `[EventRunner] ${info.sequenceId} event ${info.eventIndex} (${info.eventType}): ${info.message}`,
    );
    this.cleanupRuntime();
    this.runnerState = 'error';
  }

  private cleanupRuntime(): void {
    this.dependencies.dialogue.close();
    this.activeNpc?.stop();
    this.clearUiAndTaskState();
    this.restoreControlsAndNpcInteractions();
    this.currentEventStarted = false;
    this.waitRemainingSeconds = 0;
    this.taskPhase = 'none';
    this.activeTaskBinding = null;
    this.activeNpc = null;
  }

  private clearUiAndTaskState(): void {
    this.dependencies.phoneStory.cancelStoryPresentation();
    this.hideTransition();
    this.dependencies.taskManager.reset();
    this.dependencies.taskHud.hide();
    this.dependencies.resultOverlay.hide();
    this.dependencies.speechBubble.hide();
  }

  private hideTransition(): void {
    if (!this.transitionVisible) {
      return;
    }
    this.transitionVisible = false;
    this.dependencies.transition.hide();
  }

  private captureControls(): void {
    this.savedPlayerMovementEnabled = this.dependencies.player.isMovementEnabled;
    this.savedInteractionEnabled = this.dependencies.interaction.isInteractionEnabled;
  }

  private disableCurrentNpcInteractionsPreservingSavedState(): void {
    for (const npc of this.dependencies.npcs.values()) {
      if (!this.savedNpcInteractionStates.has(npc)) {
        this.savedNpcInteractionStates.set(npc, npc.isInteractionEnabled);
      }
      npc.setInteractionEnabled(false);
    }
  }

  private restoreControlsAndNpcInteractions(): void {
    if (this.savedPlayerMovementEnabled !== null) {
      this.dependencies.player.setMovementEnabled(this.savedPlayerMovementEnabled);
    }
    if (this.savedInteractionEnabled !== null) {
      this.dependencies.interaction.setEnabled(this.savedInteractionEnabled);
    }
    for (const [npc, enabled] of this.savedNpcInteractionStates) {
      if (this.dependencies.npcs.get(npc.id) === npc) {
        npc.setInteractionEnabled(enabled);
      }
    }

    this.savedPlayerMovementEnabled = null;
    this.savedInteractionEnabled = null;
    this.savedNpcInteractionStates.clear();
  }

  private setGameplayEnabled(enabled: boolean): void {
    this.dependencies.player.setMovementEnabled(enabled);
    this.dependencies.interaction.setEnabled(enabled);
  }

  private isValidDuration(value: number): boolean {
    return Number.isFinite(value) && value >= 0;
  }

  private isFinitePosition(position: { readonly x: number; readonly y: number; readonly z: number }): boolean {
    return Number.isFinite(position.x)
      && Number.isFinite(position.y)
      && Number.isFinite(position.z);
  }
}
