import type { SceneDefinition } from '../../scene/SceneTypes';
import { PHASE5_SCENES } from './phase5Scenes';
import {
  PHASE7_BEDROOM_SCENE_ID,
  PHASE7_CAFE_SCENE_ID,
  PHASE7_CAFE_TASK_ID,
  PHASE7_PARTNER_NPC_ID,
} from './phase7Ids';

const PLAYER_GROUNDED_Y = 0.9;
const NPC_GROUNDED_Y = 0.87;

const PHASE7_NEW_SCENES = [
  {
    id: PHASE7_BEDROOM_SCENE_ID,
    playerSpawn: {
      position: { x: 0, y: PLAYER_GROUNDED_Y, z: 3.8 },
      facing: 0,
    },
    stage: {
      width: 14,
      depth: 11,
      floorThickness: 0.4,
      wallThickness: 0.5,
      wallHeight: 1.55,
      floorColor: 0xeee5dc,
      wallColor: 0xa8bfd3,
      obstacles: [
        {
          kind: 'table',
          position: { x: -3.8, y: 0.55, z: -2.4 },
          size: { x: 3.4, y: 1.1, z: 1.8 },
          color: 0xc88e72,
        },
        {
          kind: 'table',
          position: { x: 3.7, y: 0.7, z: -1.7 },
          size: { x: 2.4, y: 1.4, z: 1.1 },
          color: 0xd0a06c,
        },
        {
          kind: 'box',
          position: { x: -4.7, y: 0.45, z: 1.6 },
          size: { x: 0.9, y: 0.9, z: 0.9 },
          color: 0x89a9bc,
        },
      ],
      items: [],
      placePoints: [],
    },
    npcs: [],
    placementTasks: [],
  },
  {
    id: PHASE7_CAFE_SCENE_ID,
    playerSpawn: {
      position: { x: 0, y: PLAYER_GROUNDED_Y, z: 4 },
      facing: 0,
    },
    stage: {
      width: 18,
      depth: 14,
      floorThickness: 0.4,
      wallThickness: 0.55,
      wallHeight: 1.6,
      floorColor: 0xeadfcf,
      wallColor: 0x9cb9aa,
      obstacles: [
        {
          kind: 'table',
          position: { x: 1.6, y: 0.7, z: 0.8 },
          size: { x: 2.4, y: 1.4, z: 1.2 },
          color: 0xb97f58,
        },
        {
          kind: 'table',
          position: { x: -4.6, y: 0.75, z: -2.8 },
          size: { x: 2.8, y: 1.5, z: 1.4 },
          color: 0x789b83,
        },
        {
          kind: 'table',
          position: { x: -4.4, y: 0.7, z: 1.2 },
          size: { x: 2.2, y: 1.4, z: 1.2 },
          color: 0xc79968,
        },
        {
          kind: 'box',
          position: { x: 0, y: 0.45, z: -3.8 },
          size: { x: 0.9, y: 0.9, z: 0.9 },
          color: 0xd5b96f,
        },
      ],
      items: [
        {
          id: 'demo-drink-1',
          kind: 'drink',
          position: { x: -0.7, y: 0, z: 3.3 },
        },
        {
          id: 'demo-drink-2',
          kind: 'drink',
          position: { x: 0.7, y: 0, z: 3.3 },
        },
      ],
      placePoints: [
        {
          id: 'cafe-table-left',
          position: { x: 1.2, y: 1.415, z: 0.8 },
        },
        {
          id: 'cafe-table-right',
          position: { x: 2, y: 1.415, z: 0.8 },
        },
      ],
    },
    npcs: [
      {
        id: PHASE7_PARTNER_NPC_ID,
        displayName: 'Demo Partner',
        position: { x: 0, y: NPC_GROUNDED_Y, z: 4.1 },
        moveSpeed: 1.8,
        turnSharpness: 10,
      },
    ],
    placementTasks: [
      {
        id: PHASE7_CAFE_TASK_ID,
        label: 'Bring both drinks to the cafe table',
        durationSeconds: 40,
        requiredItemIds: ['demo-drink-1', 'demo-drink-2'],
        targetPlacePointIds: ['cafe-table-left', 'cafe-table-right'],
        attemptPlayerPosition: { x: 0, y: PLAYER_GROUNDED_Y, z: 4 },
        attemptPlayerFacing: 0,
      },
    ],
  },
] as const satisfies readonly SceneDefinition[];

// Legacy scenes remain registered so existing Phase 6 checkpoint IDs stay resumable.
export const PHASE7_SCENES = [
  ...PHASE5_SCENES,
  ...PHASE7_NEW_SCENES,
] as const satisfies readonly SceneDefinition[];
