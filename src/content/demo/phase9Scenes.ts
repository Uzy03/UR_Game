import type { SceneDefinition } from '../../scene/SceneTypes';
import { PHASE8_SCENES } from './phase8Scenes';
import {
  PHASE9_COMPANION_NPC_ID,
  PHASE9_COMPLETE_SCENE_ID,
  PHASE9_PLACEMENT_TASK_ID,
  PHASE9_PREP_SCENE_ID,
  PHASE9_PROCESSING_TASK_ID,
  PHASE9_STATION_ID,
} from './phase9Ids';

const PLAYER_GROUNDED_Y = 0.9;
const NPC_GROUNDED_Y = 0.87;
const PREP_ITEM_IDS = ['demo-prep-fruit', 'demo-prep-packet'] as const;

const PHASE9_PREP_SCENE = {
  id: PHASE9_PREP_SCENE_ID,
  playerSpawn: {
    position: { x: 0, y: PLAYER_GROUNDED_Y, z: 5.4 },
    facing: 0,
  },
  stage: {
    width: 18,
    depth: 14,
    floorThickness: 0.4,
    wallThickness: 0.55,
    wallHeight: 1.55,
    floorColor: 0xeee3cf,
    wallColor: 0x94ad9a,
    obstacles: [
      {
        kind: 'table',
        position: { x: -3.8, y: 0.65, z: 0.5 },
        size: { x: 3.2, y: 1.3, z: 1.5 },
        color: 0x789d87,
      },
      {
        kind: 'table',
        position: { x: 3.8, y: 0.65, z: 0.5 },
        size: { x: 3.2, y: 1.3, z: 1.5 },
        color: 0xb8875f,
      },
      {
        kind: 'box',
        position: { x: 0, y: 0.55, z: -3.5 },
        size: { x: 1.1, y: 1.1, z: 1.1 },
        color: 0xd7aa62,
      },
      {
        kind: 'box',
        position: { x: -6.8, y: 0.5, z: -3.8 },
        size: { x: 1, y: 1, z: 1 },
        color: 0x6f9b75,
      },
      {
        kind: 'box',
        position: { x: 6.7, y: 0.5, z: -3.8 },
        size: { x: 1, y: 1, z: 1 },
        color: 0x7195b1,
      },
    ],
    items: [
      {
        id: PREP_ITEM_IDS[0],
        kind: 'tomato',
        position: { x: -1.25, y: 0, z: 4.4 },
      },
      {
        id: PREP_ITEM_IDS[1],
        kind: 'box',
        position: { x: 1.15, y: 0, z: 4.4 },
      },
    ],
    placePoints: [
      {
        id: 'demo-prep-table-left',
        position: { x: 3.35, y: 1.315, z: 0.5 },
      },
      {
        id: 'demo-prep-table-right',
        position: { x: 4.25, y: 1.315, z: 0.5 },
      },
    ],
  },
  npcs: [
    {
      id: PHASE9_COMPANION_NPC_ID,
      displayName: 'Demo Companion',
      position: { x: 0, y: NPC_GROUNDED_Y, z: 4 },
      moveSpeed: 1.8,
      turnSharpness: 10,
    },
  ],
  placementTasks: [
    {
      id: PHASE9_PLACEMENT_TASK_ID,
      label: 'Bring both prepared items to the table',
      durationSeconds: 35,
      requiredItemIds: PREP_ITEM_IDS,
      targetPlacePointIds: ['demo-prep-table-left', 'demo-prep-table-right'],
      attemptPlayerPosition: { x: 0, y: PLAYER_GROUNDED_Y, z: 5.4 },
      attemptPlayerFacing: 0,
      preserveWorldOnFirstAttempt: true,
      preserveItemProcessingOnRetry: true,
    },
  ],
  processingStations: [
    {
      id: PHASE9_STATION_ID,
      position: { x: -3.8, y: 1.315, z: 0.5 },
      processingDurationSeconds: 1.8,
      acceptedItemIds: PREP_ITEM_IDS,
    },
  ],
  processingTasks: [
    {
      id: PHASE9_PROCESSING_TASK_ID,
      label: 'Process both picnic items',
      requiredItemIds: PREP_ITEM_IDS,
      stationIds: [PHASE9_STATION_ID],
      durationSeconds: 45,
      attemptPlayerPosition: { x: 0, y: PLAYER_GROUNDED_Y, z: 5.4 },
      attemptPlayerFacing: 0,
    },
  ],
} as const satisfies SceneDefinition;

const PHASE9_COMPLETE_SCENE = {
  ...PHASE9_PREP_SCENE,
  id: PHASE9_COMPLETE_SCENE_ID,
  stage: {
    ...PHASE9_PREP_SCENE.stage,
    items: [
      {
        ...PHASE9_PREP_SCENE.stage.items[0],
        position: { x: 3.35, y: 1.315, z: 0.5 },
        initialProcessingState: 'processed',
      },
      {
        ...PHASE9_PREP_SCENE.stage.items[1],
        position: { x: 4.25, y: 1.315, z: 0.5 },
        initialProcessingState: 'processed',
      },
    ],
  },
} as const satisfies SceneDefinition;

const PHASE9_NEW_SCENES = [
  PHASE9_PREP_SCENE,
  PHASE9_COMPLETE_SCENE,
] as const satisfies readonly SceneDefinition[];

// Legacy Scenes remain registered so all v1 Checkpoints can still be reconstructed.
export const PHASE9_SCENES = [
  ...PHASE8_SCENES,
  ...PHASE9_NEW_SCENES,
] as const satisfies readonly SceneDefinition[];
