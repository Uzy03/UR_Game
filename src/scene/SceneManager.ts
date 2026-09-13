import type { Object3D } from 'three';
import type { TaskEventBinding } from '../events/TaskEventBinding';
import type { CarrySystem } from '../interaction/CarrySystem';
import type { InteractionSystem } from '../interaction/InteractionSystem';
import type { ItemThrowSystem } from '../interaction/ItemThrowSystem';
import type { NPCController } from '../npc/NPCController';
import type { PlayerController } from '../player/PlayerController';
import type { ResultOverlay } from '../ui/ResultOverlay';
import type { SpeechBubble } from '../ui/SpeechBubble';
import type { SceneContentRegistry } from './SceneContentRegistry';
import type { SceneRuntime } from './SceneRuntime';
import type { SceneDefinition } from './SceneTypes';

export interface SceneActions {
  loadScene(sceneId: string): void;
}

interface SceneManagerDependencies {
  readonly worldRoot: Object3D;
  readonly content: SceneContentRegistry;
  readonly player: PlayerController;
  readonly carry: CarrySystem;
  readonly interaction: InteractionSystem;
  readonly itemThrow: ItemThrowSystem;
  readonly npcs: Map<string, NPCController>;
  readonly tasks: Map<string, TaskEventBinding>;
  readonly speechBubble: SpeechBubble;
  readonly resultOverlay: ResultOverlay;
  readonly floorItemSpacing: number;
  readonly createRuntime: (definition: SceneDefinition) => SceneRuntime;
}

export class SceneManager implements SceneActions {
  private currentRuntime: SceneRuntime | null = null;
  private transitionInProgress = false;
  private disposed = false;

  public constructor(private readonly dependencies: SceneManagerDependencies) {}

  public get currentSceneId(): string | null {
    return this.currentRuntime?.definition.id ?? null;
  }

  public loadScene(sceneId: string): void {
    if (this.disposed) {
      throw new Error('Cannot load a Scene after SceneManager has been disposed.');
    }
    if (this.transitionInProgress) {
      throw new Error(`Cannot load Scene "${sceneId}" during another Scene transition.`);
    }

    const definition = this.dependencies.content.getScene(sceneId);
    if (definition === undefined) {
      throw new Error(`Scene "${sceneId}" is not registered.`);
    }

    this.transitionInProgress = true;
    let candidate: SceneRuntime | null = null;
    let swapStarted = false;

    try {
      candidate = this.dependencies.createRuntime(definition);
      const installedRuntime = candidate;
      swapStarted = true;
      this.detachCurrentScene();

      this.dependencies.worldRoot.add(installedRuntime.root);
      this.dependencies.carry.bindScene(
        installedRuntime.stage.object,
        installedRuntime.stage.pickableItems,
        (position, item, allItems) => installedRuntime.stage.isFloorDropPositionValid(
          position,
          item,
          allItems,
          this.dependencies.floorItemSpacing,
        ),
      );
      this.dependencies.itemThrow.bindScene(
        installedRuntime.stage.object,
        installedRuntime.stage.pickableItems,
        (position, item, allItems) => installedRuntime.stage.isFloorDropPositionValid(
          position,
          item,
          allItems,
          this.dependencies.floorItemSpacing,
        ),
      );

      for (const item of installedRuntime.stage.pickableItems) {
        this.dependencies.interaction.register(item);
      }
      for (const placePoint of installedRuntime.stage.placePoints) {
        this.dependencies.interaction.register(placePoint);
      }
      for (const interactable of installedRuntime.interactables) {
        this.dependencies.interaction.register(interactable);
      }
      for (const npc of installedRuntime.npcs) {
        this.dependencies.interaction.register(npc);
        this.dependencies.npcs.set(npc.id, npc);
      }
      for (const taskBinding of installedRuntime.taskBindings) {
        this.dependencies.tasks.set(taskBinding.task.id, taskBinding);
      }

      this.dependencies.player.reset(
        definition.playerSpawn.position,
        definition.playerSpawn.facing,
      );
      this.currentRuntime = installedRuntime;
      candidate = null;
    } catch (error: unknown) {
      if (swapStarted) {
        this.dependencies.interaction.clearInteractables();
        this.dependencies.itemThrow.unbindScene();
        this.dependencies.carry.unbindScene();
        this.dependencies.npcs.clear();
        this.dependencies.tasks.clear();
        this.currentRuntime = null;
      }
      candidate?.dispose();
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load Scene "${sceneId}": ${message}`, { cause: error });
    } finally {
      this.transitionInProgress = false;
    }
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.detachCurrentScene();
  }

  public unloadScene(): void {
    if (this.disposed) {
      return;
    }
    this.detachCurrentScene();
  }

  private detachCurrentScene(): void {
    this.dependencies.interaction.clearInteractables();
    this.dependencies.itemThrow.unbindScene();
    this.dependencies.carry.unbindScene();
    this.dependencies.speechBubble.hide();
    this.dependencies.resultOverlay.hide();
    this.dependencies.npcs.clear();
    this.dependencies.tasks.clear();
    this.currentRuntime?.dispose();
    this.currentRuntime = null;
  }
}
