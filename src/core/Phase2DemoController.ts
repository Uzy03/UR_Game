import type { PerspectiveCamera, Vector3Like } from 'three';
import type { DialogueManager } from '../dialogue/DialogueManager';
import type { DialogueSequence } from '../dialogue/DialogueTypes';
import type { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import type { CarrySystem } from '../interaction/CarrySystem';
import type { InteractionSystem } from '../interaction/InteractionSystem';
import type { PickableItem } from '../interaction/PickableItem';
import type { PlacePoint } from '../interaction/PlacePoint';
import type { NPCController } from '../npc/NPCController';
import type { PlayerController } from '../player/PlayerController';
import type { PlacementTask } from '../task/PlacementTask';
import type { TaskManager } from '../task/TaskManager';
import type { TaskResult } from '../task/Task';
import type { ResultOverlay } from '../ui/ResultOverlay';
import type { SpeechBubble } from '../ui/SpeechBubble';
import type { TaskHUD } from '../ui/TaskHUD';

export type Phase2DemoMode = 'exploration' | 'dialogue' | 'playing-task' | 'result';

interface Phase2DemoOptions {
  readonly introDialogue: DialogueSequence;
  readonly retryPlayerPosition: Readonly<Vector3Like>;
  readonly retryPlayerFacing: number;
  readonly npcTaskPosition: Readonly<Vector3Like>;
  readonly successSpeech: string;
  readonly speechDurationSeconds: number;
}

interface Phase2DemoDependencies {
  readonly input: InputManager;
  readonly player: PlayerController;
  readonly interaction: InteractionSystem;
  readonly carry: CarrySystem;
  readonly items: readonly PickableItem[];
  readonly placePoints: readonly PlacePoint[];
  readonly npc: NPCController;
  readonly dialogue: DialogueManager;
  readonly taskManager: TaskManager;
  readonly placementTask: PlacementTask;
  readonly taskHud: TaskHUD;
  readonly resultOverlay: ResultOverlay;
  readonly speechBubble: SpeechBubble;
}

// This class is intentionally a small Phase 2 demo flow. Phase 3 replaces it with EventRunner.
export class Phase2DemoController {
  private mode: Phase2DemoMode = 'exploration';
  private result: TaskResult | null = null;

  public constructor(
    private readonly dependencies: Phase2DemoDependencies,
    private readonly options: Phase2DemoOptions,
  ) {
    dependencies.npc.setInteractionHandler(this.startIntroDialogue);
    dependencies.taskManager.setFinishedHandler((_task, result) => this.finishTask(result));
    dependencies.taskHud.hide();
    dependencies.resultOverlay.hide();
    dependencies.speechBubble.hide();
    this.applyMode();
  }

  public get currentMode(): Phase2DemoMode {
    return this.mode;
  }

  public update(deltaSeconds: number): void {
    const { input, dialogue, taskManager, taskHud } = this.dependencies;

    if (this.mode === 'dialogue') {
      dialogue.update(input.consumeActionPress(InputAction.Interact));
      return;
    }

    if (this.mode === 'playing-task') {
      taskManager.update(deltaSeconds);
      taskHud.update(taskManager.currentTask);
      return;
    }

    if (
      this.mode === 'result'
      && this.result === 'failed'
      && input.consumeActionPress(InputAction.Retry)
    ) {
      this.startTask();
    }
  }

  public updatePresentation(camera: PerspectiveCamera, deltaSeconds: number): void {
    this.dependencies.speechBubble.update(camera, deltaSeconds);
  }

  public dispose(): void {
    this.dependencies.npc.setInteractionHandler(null);
    this.dependencies.taskManager.setFinishedHandler(null);
    this.dependencies.dialogue.close();
    this.dependencies.taskHud.hide();
    this.dependencies.resultOverlay.hide();
    this.dependencies.speechBubble.hide();
  }

  private readonly startIntroDialogue = (): boolean => {
    if (this.mode !== 'exploration') {
      return false;
    }

    this.setMode('dialogue');
    this.dependencies.dialogue.start(this.options.introDialogue, this.startTask);
    return true;
  };

  private readonly startTask = (): void => {
    const {
      carry,
      dialogue,
      interaction,
      items,
      npc,
      placePoints,
      placementTask,
      player,
      resultOverlay,
      speechBubble,
      taskHud,
      taskManager,
    } = this.dependencies;

    dialogue.close();
    taskManager.reset();
    interaction.reset();
    carry.reset();
    for (const placePoint of placePoints) {
      placePoint.reset();
    }
    for (const item of items) {
      item.reset();
    }
    player.reset(this.options.retryPlayerPosition, this.options.retryPlayerFacing);
    npc.moveTo(this.options.npcTaskPosition);
    speechBubble.hide();
    resultOverlay.hide();
    this.result = null;

    taskManager.start(placementTask);
    taskHud.update(placementTask);
    this.setMode('playing-task');
  };

  private finishTask(result: TaskResult): void {
    this.result = result;
    this.dependencies.taskHud.hide();
    if (result === 'succeeded') {
      this.dependencies.speechBubble.show(
        this.dependencies.npc.speechAnchor,
        this.options.successSpeech,
        this.options.speechDurationSeconds,
      );
    }
    this.dependencies.resultOverlay.show(result);
    this.setMode('result');
  }

  private setMode(mode: Phase2DemoMode): void {
    this.mode = mode;
    this.applyMode();
  }

  private applyMode(): void {
    const allowsGameplay = this.mode === 'exploration' || this.mode === 'playing-task';
    this.dependencies.player.setMovementEnabled(allowsGameplay);
    this.dependencies.interaction.setEnabled(allowsGameplay);
    this.dependencies.npc.setInteractionEnabled(this.mode === 'exploration');
  }
}
