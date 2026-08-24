import { Group } from 'three';
import { PlacementTaskEventBinding } from '../events/PlacementTaskEventBinding';
import type { TaskEventBinding } from '../events/TaskEventBinding';
import type { CarrySystem } from '../interaction/CarrySystem';
import type { InteractionSystem } from '../interaction/InteractionSystem';
import { NPCController } from '../npc/NPCController';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import type { PlayerController } from '../player/PlayerController';
import { Stage } from '../stage/Stage';
import { CountdownTimer } from '../task/CountdownTimer';
import { PlacementTask } from '../task/PlacementTask';
import type { ResultOverlay } from '../ui/ResultOverlay';
import type { SpeechBubble } from '../ui/SpeechBubble';
import type { SceneDefinition } from './SceneTypes';

export type NpcInteractionHandlerFactory = (
  sceneId: string,
  npcId: string,
) => (() => boolean) | null;

export interface SceneRuntimeDependencies {
  readonly physics: PhysicsWorld;
  readonly player: PlayerController;
  readonly carry: CarrySystem;
  readonly interaction: InteractionSystem;
  readonly resultOverlay: ResultOverlay;
  readonly speechBubble: SpeechBubble;
  readonly createNpcInteractionHandler: NpcInteractionHandlerFactory;
}

export class SceneRuntime {
  public readonly root: Group;
  public readonly stage: Stage;
  public readonly npcs: readonly NPCController[];
  public readonly taskBindings: readonly TaskEventBinding[];
  private disposed = false;

  private constructor(
    public readonly definition: SceneDefinition,
    root: Group,
    stage: Stage,
    npcs: readonly NPCController[],
    taskBindings: readonly TaskEventBinding[],
  ) {
    this.root = root;
    this.stage = stage;
    this.npcs = npcs;
    this.taskBindings = taskBindings;
  }

  public static create(
    definition: SceneDefinition,
    dependencies: SceneRuntimeDependencies,
  ): SceneRuntime {
    const root = new Group();
    root.name = `Scene:${definition.id}`;
    let stage: Stage | null = null;
    const npcs: NPCController[] = [];

    try {
      stage = new Stage(root, dependencies.physics, definition.stage);
      const activeStage = stage;
      for (const npcDefinition of definition.npcs) {
        const npc = new NPCController({
          id: npcDefinition.id,
          displayName: npcDefinition.displayName,
          position: npcDefinition.position,
          moveSpeed: npcDefinition.moveSpeed,
          turnSharpness: npcDefinition.turnSharpness,
        });
        npc.setInteractionHandler(
          dependencies.createNpcInteractionHandler(definition.id, npcDefinition.id),
        );
        root.add(npc.object);
        npcs.push(npc);
      }

      const taskBindings = definition.placementTasks.map((taskDefinition) => {
        const task = new PlacementTask(new CountdownTimer(), {
          id: taskDefinition.id,
          label: taskDefinition.label,
          requiredItemIds: taskDefinition.requiredItemIds,
          targetPlacePoints: activeStage.getPlacePoints(taskDefinition.targetPlacePointIds),
          durationSeconds: taskDefinition.durationSeconds,
        });
        return new PlacementTaskEventBinding({
          task,
          carry: dependencies.carry,
          interaction: dependencies.interaction,
          items: activeStage.pickableItems,
          placePoints: activeStage.placePoints,
          player: dependencies.player,
          playerStartPosition: taskDefinition.attemptPlayerPosition,
          playerStartFacing: taskDefinition.attemptPlayerFacing,
          resultOverlay: dependencies.resultOverlay,
          speechBubble: dependencies.speechBubble,
        });
      });

      return new SceneRuntime(definition, root, stage, npcs, taskBindings);
    } catch (error: unknown) {
      for (const npc of npcs) {
        npc.dispose();
      }
      stage?.dispose();
      root.removeFromParent();
      root.clear();
      throw error;
    }
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;

    for (const npc of this.npcs) {
      npc.dispose();
    }
    this.stage.dispose();
    this.root.removeFromParent();
    this.root.clear();
  }
}
