import type {
  ItemProcessingState,
  PickableItemKind,
} from '../interaction/PickableItem';

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
  readonly initialProcessingState?: ItemProcessingState;
  readonly initialActive?: boolean;
}

export interface StagePlacePointDefinition {
  readonly id: string;
  readonly position: Vector3Config;
}

export type StageDecorationKind =
  | 'bed'
  | 'bench'
  | 'chair'
  | 'flower-cluster'
  | 'gift'
  | 'lamp'
  | 'railing'
  | 'rock'
  | 'rug'
  | 'plant'
  | 'tree'
  | 'wall-art'
  | 'shelf'
  | 'table-setting'
  | 'pendant';

export interface StageDecorationDefinition {
  readonly kind: StageDecorationKind;
  readonly position: Vector3Config;
  readonly rotationY?: number;
  readonly scale?: Vector3Config;
  readonly primaryColor: number;
  readonly secondaryColor?: number;
}

export interface StageVisualStyleDefinition {
  readonly plinthColor: number;
  readonly floorLineColor?: number;
  readonly wallTrimColor?: number;
}

export interface StageDefinition {
  readonly width: number;
  readonly depth: number;
  readonly floorThickness: number;
  readonly wallThickness: number;
  readonly wallHeight: number;
  readonly floorColor: number;
  readonly wallColor: number;
  readonly visualStyle?: StageVisualStyleDefinition;
  readonly decorations?: readonly StageDecorationDefinition[];
  readonly obstacles: readonly StageObstacleDefinition[];
  readonly items: readonly StagePickableItemDefinition[];
  readonly placePoints: readonly StagePlacePointDefinition[];
}
