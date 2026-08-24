import type {
  StageObstacleDefinition,
  StagePickableItemDefinition,
  StagePlacePointDefinition,
} from '../stage/StageTypes';

export type {
  StageObstacleDefinition as StageObstacleConfig,
  StagePickableItemDefinition as StagePickableItemConfig,
  StagePlacePointDefinition as StagePlacePointConfig,
  Vector3Config,
} from '../stage/StageTypes';

const PLAYER_COLLIDER_RADIUS = 0.42;
const PLAYER_COLLIDER_HALF_HEIGHT = 0.45;
const CHARACTER_OFFSET = 0.03;
const PLAYER_GROUNDED_Y = (
  PLAYER_COLLIDER_RADIUS
  + PLAYER_COLLIDER_HALF_HEIGHT
  + CHARACTER_OFFSET
);

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
    characterOffset: CHARACTER_OFFSET,
    // Snap-to-ground needs only a slight downward component; a gravity-sized probe can penetrate the floor.
    groundProbeSpeed: 0.006,
  },
  player: {
    spawn: { x: 0, y: PLAYER_GROUNDED_Y, z: 4.1 },
    speed: 4.4,
    turnSharpness: 14,
    collider: {
      radius: PLAYER_COLLIDER_RADIUS,
      halfHeight: PLAYER_COLLIDER_HALF_HEIGHT,
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
    retryPlayerPosition: { x: 0, y: PLAYER_GROUNDED_Y, z: 4.1 },
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
  phase3: {
    successResultDurationSeconds: 0.9,
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
    ] satisfies readonly StageObstacleDefinition[],
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
    ] satisfies readonly StagePickableItemDefinition[],
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
    ] satisfies readonly StagePlacePointDefinition[],
  },
} as const;
