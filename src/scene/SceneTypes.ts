import type { StageDefinition, Vector3Config } from '../stage/StageTypes';

export interface ScenePlayerSpawnDefinition {
  readonly position: Vector3Config;
  readonly facing: number;
}

export interface SceneNpcDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly position: Vector3Config;
  readonly moveSpeed: number;
  readonly turnSharpness: number;
}

export interface ScenePlacementTaskDefinition {
  readonly id: string;
  readonly label: string;
  readonly durationSeconds: number;
  readonly requiredItemIds: readonly string[];
  readonly targetPlacePointIds: readonly string[];
  readonly attemptPlayerPosition: Vector3Config;
  readonly attemptPlayerFacing: number;
  readonly preserveWorldOnFirstAttempt?: boolean;
  readonly preserveItemProcessingOnRetry?: boolean;
  readonly preserveItemRuntimeOnRetry?: boolean;
}

export interface SceneReachTaskDefinition {
  readonly id: string;
  readonly label: string;
  readonly targetPosition: Vector3Config;
  readonly radius: number;
}

export interface SceneProcessingStationDefinition {
  readonly id: string;
  readonly position: Vector3Config;
  readonly processingDurationSeconds: number;
  readonly acceptedItemIds: readonly string[];
}

export interface SceneProcessingTaskDefinition {
  readonly id: string;
  readonly label: string;
  readonly requiredItemIds: readonly string[];
  readonly stationIds: readonly string[];
  readonly durationSeconds: number;
  readonly attemptPlayerPosition: Vector3Config;
  readonly attemptPlayerFacing: number;
}

export interface SceneAssemblyStationDefinition {
  readonly id: string;
  readonly position: Vector3Config;
  readonly inputItemIds: readonly [string, string];
  readonly outputItemId: string;
  readonly combineDurationSeconds: number;
}

export interface SceneAssemblyTaskDefinition {
  readonly id: string;
  readonly label: string;
  readonly stationIds: readonly string[];
  readonly durationSeconds: number;
  readonly attemptPlayerPosition: Vector3Config;
  readonly attemptPlayerFacing: number;
}

export interface SceneDefinition {
  readonly id: string;
  readonly playerSpawn: ScenePlayerSpawnDefinition;
  readonly stage: StageDefinition;
  readonly npcs: readonly SceneNpcDefinition[];
  readonly placementTasks: readonly ScenePlacementTaskDefinition[];
  readonly reachTasks?: readonly SceneReachTaskDefinition[];
  readonly processingStations?: readonly SceneProcessingStationDefinition[];
  readonly processingTasks?: readonly SceneProcessingTaskDefinition[];
  readonly assemblyStations?: readonly SceneAssemblyStationDefinition[];
  readonly assemblyTasks?: readonly SceneAssemblyTaskDefinition[];
}
