import { Group } from 'three';
import { AssemblyTaskEventBinding } from '../events/AssemblyTaskEventBinding';
import { PlacementTaskEventBinding } from '../events/PlacementTaskEventBinding';
import { ProcessingTaskEventBinding } from '../events/ProcessingTaskEventBinding';
import { ReachZoneTaskEventBinding } from '../events/ReachZoneTaskEventBinding';
import type { TaskEventBinding } from '../events/TaskEventBinding';
import type { CarrySystem } from '../interaction/CarrySystem';
import { AssemblyStation } from '../interaction/AssemblyStation';
import type { Interactable } from '../interaction/Interactable';
import type { InteractionSystem } from '../interaction/InteractionSystem';
import type { ItemThrowSystem } from '../interaction/ItemThrowSystem';
import { ProcessingStation } from '../interaction/ProcessingStation';
import type { ThrowReceiver } from '../interaction/ThrowReceiver';
import { WorkMotionSystem, type WorkMotionOptions } from '../interaction/WorkMotionSystem';
import { NPCController, type NpcThrowCatchOptions } from '../npc/NPCController';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import type { PlayerController } from '../player/PlayerController';
import { Stage } from '../stage/Stage';
import { CountdownTimer } from '../task/CountdownTimer';
import { AssemblyTask } from '../task/AssemblyTask';
import { PlacementTask } from '../task/PlacementTask';
import { ProcessingTask } from '../task/ProcessingTask';
import { ReachZoneTask } from '../task/ReachZoneTask';
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
  readonly itemThrow: ItemThrowSystem;
  readonly resultOverlay: ResultOverlay;
  readonly speechBubble: SpeechBubble;
  readonly createNpcInteractionHandler: NpcInteractionHandlerFactory;
  readonly npcThrowCatch: NpcThrowCatchOptions;
  readonly workMotion: WorkMotionOptions;
}

export class SceneRuntime {
  public readonly root: Group;
  public readonly stage: Stage;
  public readonly npcs: readonly NPCController[];
  public readonly interactables: readonly Interactable[];
  public readonly throwReceivers: readonly ThrowReceiver[];
  public readonly taskBindings: readonly TaskEventBinding[];
  private readonly workMotionSystem: WorkMotionSystem;
  private disposed = false;

  private constructor(
    public readonly definition: SceneDefinition,
    root: Group,
    stage: Stage,
    npcs: readonly NPCController[],
    interactables: readonly Interactable[],
    processingStations: readonly ProcessingStation[],
    assemblyStations: readonly AssemblyStation[],
    throwReceivers: readonly ThrowReceiver[],
    taskBindings: readonly TaskEventBinding[],
    player: PlayerController,
    workMotion: WorkMotionOptions,
  ) {
    this.root = root;
    this.stage = stage;
    this.npcs = npcs;
    this.interactables = interactables;
    this.throwReceivers = throwReceivers;
    this.taskBindings = taskBindings;
    this.workMotionSystem = new WorkMotionSystem(
      player,
      processingStations,
      assemblyStations,
      workMotion,
    );
  }

  public static create(
    definition: SceneDefinition,
    dependencies: SceneRuntimeDependencies,
  ): SceneRuntime {
    const root = new Group();
    root.name = `Scene:${definition.id}`;
    let stage: Stage | null = null;
    const npcs: NPCController[] = [];
    const interactables: Interactable[] = [];

    try {
      stage = new Stage(
        root,
        dependencies.physics,
        definition.stage,
        dependencies.itemThrow.landingSpacing,
      );
      const activeStage = stage;
      for (const npcDefinition of definition.npcs) {
        const npc = new NPCController({
          id: npcDefinition.id,
          displayName: npcDefinition.displayName,
          position: npcDefinition.position,
          moveSpeed: npcDefinition.moveSpeed,
          turnSharpness: npcDefinition.turnSharpness,
          throwCatch: dependencies.npcThrowCatch,
        });
        npc.setInteractionHandler(
          dependencies.createNpcInteractionHandler(definition.id, npcDefinition.id),
        );
        root.add(npc.object);
        npcs.push(npc);
      }

      const processingStations = (definition.processingStations ?? []).map(
        (stationDefinition) => new ProcessingStation({
          id: stationDefinition.id,
          position: stationDefinition.position,
          processingDurationSeconds: stationDefinition.processingDurationSeconds,
          acceptedItemIds: stationDefinition.acceptedItemIds,
          parent: activeStage.object,
        }),
      );
      interactables.push(...processingStations);

      const getProcessingStations = (ids: readonly string[]): readonly ProcessingStation[] => (
        ids.map((id) => {
          const station = processingStations.find((candidate) => candidate.id === id);
          if (station === undefined) {
            throw new Error(`ProcessingStation "${id}" was not found in the Scene.`);
          }
          return station;
        })
      );

      const assemblyStations = (definition.assemblyStations ?? []).map((stationDefinition) => {
        const [inputAId, inputBId] = stationDefinition.inputItemIds;
        const inputA = activeStage.getPickableItems([inputAId])[0];
        const inputB = activeStage.getPickableItems([inputBId])[0];
        const outputItem = activeStage.getPickableItems([stationDefinition.outputItemId])[0];
        if (inputA === undefined || inputB === undefined || outputItem === undefined) {
          throw new Error(`AssemblyStation "${stationDefinition.id}" Item resolution failed.`);
        }
        return new AssemblyStation({
          id: stationDefinition.id,
          position: stationDefinition.position,
          inputItems: [inputA, inputB],
          outputItem,
          combineDurationSeconds: stationDefinition.combineDurationSeconds,
          parent: activeStage.object,
        });
      });
      interactables.push(...assemblyStations);

      const getAssemblyStations = (ids: readonly string[]): readonly AssemblyStation[] => (
        ids.map((id) => {
          const station = assemblyStations.find((candidate) => candidate.id === id);
          if (station === undefined) {
            throw new Error(`AssemblyStation "${id}" was not found in the Scene.`);
          }
          return station;
        })
      );

      const resetFeelPresentation = (): void => {
        dependencies.player.setWorkMode('none');
        for (const npc of npcs) {
          npc.resetPresentation();
        }
      };

      const taskBindings: TaskEventBinding[] = definition.placementTasks.map((taskDefinition) => {
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
          itemThrow: dependencies.itemThrow,
          items: activeStage.pickableItems,
          placePoints: activeStage.placePoints,
          player: dependencies.player,
          playerStartPosition: taskDefinition.attemptPlayerPosition,
          playerStartFacing: taskDefinition.attemptPlayerFacing,
          resultOverlay: dependencies.resultOverlay,
          speechBubble: dependencies.speechBubble,
          preserveWorldOnFirstAttempt: taskDefinition.preserveWorldOnFirstAttempt,
          preserveItemProcessingOnRetry: taskDefinition.preserveItemProcessingOnRetry,
          preserveItemRuntimeOnRetry: taskDefinition.preserveItemRuntimeOnRetry,
          resetFeelPresentation,
          worldRoot: activeStage.object,
          resetBeforeItems: () => {
            for (const station of processingStations) {
              station.reset();
            }
            for (const station of assemblyStations) {
              station.reset();
            }
          },
        });
      });

      for (const taskDefinition of definition.reachTasks ?? []) {
        const task = new ReachZoneTask({
          id: taskDefinition.id,
          label: taskDefinition.label,
          playerPosition: dependencies.player.object.position,
          targetPosition: taskDefinition.targetPosition,
          radius: taskDefinition.radius,
          markerParent: activeStage.object,
        });
        taskBindings.push(new ReachZoneTaskEventBinding({
          task,
          interaction: dependencies.interaction,
          resultOverlay: dependencies.resultOverlay,
          speechBubble: dependencies.speechBubble,
        }));
      }

      for (const taskDefinition of definition.processingTasks ?? []) {
        const taskStations = getProcessingStations(taskDefinition.stationIds);
        const task = new ProcessingTask(new CountdownTimer(), {
          id: taskDefinition.id,
          label: taskDefinition.label,
          requiredItems: activeStage.getPickableItems(taskDefinition.requiredItemIds),
          stations: taskStations,
          durationSeconds: taskDefinition.durationSeconds,
        });
        taskBindings.push(new ProcessingTaskEventBinding({
          task,
          carry: dependencies.carry,
          interaction: dependencies.interaction,
          itemThrow: dependencies.itemThrow,
          items: activeStage.pickableItems,
          placePoints: activeStage.placePoints,
          stations: processingStations,
          player: dependencies.player,
          playerStartPosition: taskDefinition.attemptPlayerPosition,
          playerStartFacing: taskDefinition.attemptPlayerFacing,
          resultOverlay: dependencies.resultOverlay,
          speechBubble: dependencies.speechBubble,
          resetFeelPresentation,
        }));
      }

      for (const taskDefinition of definition.assemblyTasks ?? []) {
        const taskStations = getAssemblyStations(taskDefinition.stationIds);
        const task = new AssemblyTask(new CountdownTimer(), {
          id: taskDefinition.id,
          label: taskDefinition.label,
          stations: taskStations,
          durationSeconds: taskDefinition.durationSeconds,
        });
        taskBindings.push(new AssemblyTaskEventBinding({
          task,
          carry: dependencies.carry,
          interaction: dependencies.interaction,
          itemThrow: dependencies.itemThrow,
          items: activeStage.pickableItems,
          placePoints: activeStage.placePoints,
          stations: assemblyStations,
          player: dependencies.player,
          playerStartPosition: taskDefinition.attemptPlayerPosition,
          playerStartFacing: taskDefinition.attemptPlayerFacing,
          resultOverlay: dependencies.resultOverlay,
          speechBubble: dependencies.speechBubble,
          resetFeelPresentation,
        }));
      }

      const throwReceivers: ThrowReceiver[] = [
        ...activeStage.placePoints,
        ...processingStations,
        ...assemblyStations,
        ...npcs,
        ...activeStage.tableThrowSurfaces,
      ];
      return new SceneRuntime(
        definition,
        root,
        stage,
        npcs,
        interactables,
        processingStations,
        assemblyStations,
        throwReceivers,
        taskBindings,
        dependencies.player,
        dependencies.workMotion,
      );
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

  public updatePresentation(deltaSeconds: number): void {
    if (this.disposed) {
      return;
    }
    this.workMotionSystem.update(deltaSeconds);
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;

    this.workMotionSystem.reset();

    for (const npc of this.npcs) {
      npc.dispose();
    }
    this.stage.dispose();
    this.root.removeFromParent();
    this.root.clear();
  }
}
