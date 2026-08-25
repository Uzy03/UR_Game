import type { SceneDefinition } from '../../scene/SceneTypes';
import { PHASE7_SCENES } from './phase7Scenes';
import {
  PHASE8_FOUNTAIN_REACH_TASK_ID,
  PHASE8_FRIEND_NPC_ID,
  PHASE8_PLACEMENT_TASK_ID,
  PHASE8_PROMENADE_SCENE_ID,
  PHASE8_VIEWPOINT_REACH_TASK_ID,
} from './phase8Ids';

const PLAYER_GROUNDED_Y = 0.9;
const NPC_GROUNDED_Y = 0.87;

const PHASE8_NEW_SCENES = [
  {
    id: PHASE8_PROMENADE_SCENE_ID,
    playerSpawn: {
      position: { x: 0, y: PLAYER_GROUNDED_Y, z: 6 },
      facing: 0,
    },
    stage: {
      width: 24,
      depth: 16,
      floorThickness: 0.4,
      wallThickness: 0.55,
      wallHeight: 1.45,
      floorColor: 0xdce7ce,
      wallColor: 0x77a58a,
      obstacles: [
        {
          kind: 'table',
          position: { x: 3.5, y: 0.65, z: 3.2 },
          size: { x: 3, y: 1.3, z: 1.2 },
          color: 0xa97856,
        },
        {
          kind: 'box',
          position: { x: -3.5, y: 0.65, z: -0.3 },
          size: { x: 2.2, y: 1.3, z: 2.2 },
          color: 0x6ba8bc,
        },
        {
          kind: 'box',
          position: { x: 8.6, y: 0.8, z: -5.7 },
          size: { x: 1.2, y: 1.6, z: 1.2 },
          color: 0xd6a963,
        },
        {
          kind: 'box',
          position: { x: -8.8, y: 0.6, z: 2.2 },
          size: { x: 1.2, y: 1.2, z: 1.2 },
          color: 0x6f9a67,
        },
        {
          kind: 'box',
          position: { x: 8.5, y: 0.55, z: 1.6 },
          size: { x: 1.1, y: 1.1, z: 1.1 },
          color: 0x769e69,
        },
      ],
      items: [
        {
          id: 'demo-picnic-box',
          kind: 'box',
          position: { x: -1.2, y: 0, z: 5.1 },
        },
      ],
      placePoints: [
        {
          id: 'demo-promenade-bench-point',
          position: { x: 3.5, y: 1.315, z: 3.2 },
        },
      ],
    },
    npcs: [
      {
        id: PHASE8_FRIEND_NPC_ID,
        displayName: 'Demo Friend',
        position: { x: 0.9, y: NPC_GROUNDED_Y, z: 4.6 },
        moveSpeed: 1.9,
        turnSharpness: 10,
      },
    ],
    placementTasks: [
      {
        id: PHASE8_PLACEMENT_TASK_ID,
        label: 'Bring the picnic box to the bench',
        durationSeconds: 35,
        requiredItemIds: ['demo-picnic-box'],
        targetPlacePointIds: ['demo-promenade-bench-point'],
        attemptPlayerPosition: { x: 0, y: PLAYER_GROUNDED_Y, z: 6 },
        attemptPlayerFacing: 0,
      },
    ],
    reachTasks: [
      {
        id: PHASE8_FOUNTAIN_REACH_TASK_ID,
        label: 'Walk to the fountain',
        targetPosition: { x: -3.5, y: 0, z: -2.6 },
        radius: 0.9,
      },
      {
        id: PHASE8_VIEWPOINT_REACH_TASK_ID,
        label: 'Walk to the viewpoint',
        targetPosition: { x: 7, y: 0, z: -4.6 },
        radius: 1,
      },
    ],
  },
] as const satisfies readonly SceneDefinition[];

// Older scenes remain available so v1 saves can still resolve their checkpoint IDs.
export const PHASE8_SCENES = [
  ...PHASE7_SCENES,
  ...PHASE8_NEW_SCENES,
] as const satisfies readonly SceneDefinition[];
