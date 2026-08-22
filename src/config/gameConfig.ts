import type { PickableItemKind } from '../interaction/PickableItem';

export interface Vector3Config {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface StageObstacleConfig {
  readonly kind: 'table' | 'box';
  readonly position: Vector3Config;
  readonly size: Vector3Config;
  readonly color: number;
}

export interface StagePickableItemConfig {
  readonly id: string;
  readonly kind: PickableItemKind;
  readonly position: Vector3Config;
}

export interface StagePlacePointConfig {
  readonly id: string;
  readonly position: Vector3Config;
}

export const GAME_CONFIG = {
  loop: {
    maxDeltaSeconds: 1 / 20,
  },
  renderer: {
    maxPixelRatio: 2,
    clearColor: 0xb9d9e8,
  },
  physics: {
    gravity: { x: 0, y: -9.81, z: 0 },
    characterOffset: 0.03,
    groundProbeSpeed: 3,
  },
  player: {
    spawn: { x: 0, y: 0.87, z: 4.1 },
    speed: 4.4,
    turnSharpness: 14,
    collider: {
      radius: 0.42,
      halfHeight: 0.45,
    },
  },
  npc: {
    id: 'helper-npc',
    displayName: 'Helper',
    spawn: { x: 0, y: 0.87, z: 5.5 },
    taskPosition: { x: -1.35, y: 0.87, z: 5.5 },
    moveSpeed: 1.8,
    turnSharpness: 10,
  },
  camera: {
    fov: 38,
    near: 0.1,
    far: 100,
    offset: { x: 9.5, y: 12, z: 10.5 },
    lookAtOffset: { x: 0, y: 0.55, z: 0 },
    positionSharpness: 5.5,
    lookAtSharpness: 8,
  },
  interaction: {
    maxDistance: 1.65,
    minForwardDot: 0.2,
    facingPenalty: 0.85,
    floorDropDistance: 0.9,
    floorItemSpacing: 0.08,
  },
  phase2: {
    taskDurationSeconds: 45,
    retryPlayerPosition: { x: 0, y: 0.87, z: 4.1 },
    retryPlayerFacing: 0,
    successSpeech: 'We did it!',
    speechDurationSeconds: 2.5,
    introDialogue: {
      id: 'phase-2-intro',
      lines: [
        { speaker: 'Helper', text: 'Could you give me a hand?' },
        { speaker: 'Helper', text: 'Please carry these three items to the green counter.' },
        { speaker: 'Helper', text: 'Try to finish before time runs out!' },
      ],
    },
    placementTask: {
      id: 'counter-delivery',
      label: 'Carry all 3 items to the green counter',
      requiredItemIds: ['tomato-1', 'parcel-1', 'plate-1'],
      targetPlacePointIds: [
        'green-counter-left',
        'green-counter-center',
        'green-counter-right',
      ],
    },
  },
  stage: {
    width: 18,
    depth: 14,
    floorThickness: 0.4,
    wallThickness: 0.55,
    wallHeight: 1.65,
    obstacles: [
      {
        kind: 'table',
        position: { x: -3.6, y: 0.75, z: -1.5 },
        size: { x: 3.4, y: 1.5, z: 1.5 },
        color: 0xc98956,
      },
      {
        kind: 'table',
        position: { x: 3.5, y: 0.7, z: 2.0 },
        size: { x: 2.7, y: 1.4, z: 1.2 },
        color: 0x74a884,
      },
      {
        kind: 'box',
        position: { x: 2.7, y: 0.75, z: -2.9 },
        size: { x: 1.5, y: 1.5, z: 1.5 },
        color: 0xe3ae55,
      },
      {
        kind: 'box',
        position: { x: 0.25, y: 0.55, z: 0.6 },
        size: { x: 1.1, y: 1.1, z: 1.1 },
        color: 0xde7c68,
      },
      {
        kind: 'box',
        position: { x: -6.1, y: 0.45, z: 3.3 },
        size: { x: 0.9, y: 0.9, z: 0.9 },
        color: 0x7da7cf,
      },
    ] satisfies readonly StageObstacleConfig[],
    items: [
      {
        id: 'tomato-1',
        kind: 'tomato',
        position: { x: -2.4, y: 0, z: 3.9 },
      },
      {
        id: 'parcel-1',
        kind: 'box',
        position: { x: 1.55, y: 0, z: 2.55 },
      },
      {
        id: 'plate-1',
        kind: 'plate',
        position: { x: -1.8, y: 0, z: 2.5 },
      },
    ] satisfies readonly StagePickableItemConfig[],
    placePoints: [
      {
        id: 'wood-table-point',
        position: { x: -3.6, y: 1.515, z: -1.5 },
      },
      {
        id: 'green-counter-left',
        position: { x: 2.75, y: 1.415, z: 2 },
      },
      {
        id: 'green-counter-center',
        position: { x: 3.5, y: 1.415, z: 2 },
      },
      {
        id: 'green-counter-right',
        position: { x: 4.25, y: 1.415, z: 2 },
      },
    ] satisfies readonly StagePlacePointConfig[],
  },
} as const;
