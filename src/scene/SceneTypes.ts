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
}

export interface SceneReachTaskDefinition {
  readonly id: string;
  readonly label: string;
  readonly targetPosition: Vector3Config;
  readonly radius: number;
}

export interface SceneDefinition {
  readonly id: string;
  readonly playerSpawn: ScenePlayerSpawnDefinition;
  readonly stage: StageDefinition;
  readonly npcs: readonly SceneNpcDefinition[];
  readonly placementTasks: readonly ScenePlacementTaskDefinition[];
  readonly reachTasks?: readonly SceneReachTaskDefinition[];
}
