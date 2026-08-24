import type { PickableItemKind } from '../interaction/PickableItem';

export interface Vector3Config {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface StageObstacleDefinition {
  readonly kind: 'table' | 'box';
  readonly position: Vector3Config;
  readonly size: Vector3Config;
  readonly color: number;
}

export interface StagePickableItemDefinition {
  readonly id: string;
  readonly kind: PickableItemKind;
  readonly position: Vector3Config;
}

export interface StagePlacePointDefinition {
  readonly id: string;
  readonly position: Vector3Config;
}

export interface StageDefinition {
  readonly width: number;
  readonly depth: number;
  readonly floorThickness: number;
  readonly wallThickness: number;
  readonly wallHeight: number;
  readonly floorColor: number;
  readonly wallColor: number;
  readonly obstacles: readonly StageObstacleDefinition[];
  readonly items: readonly StagePickableItemDefinition[];
  readonly placePoints: readonly StagePlacePointDefinition[];
}
