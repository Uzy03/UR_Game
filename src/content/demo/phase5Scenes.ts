import type { SceneDefinition } from '../../scene/SceneTypes';

export const PHASE5_INITIAL_SCENE_ID = 'demo-room';
export const PHASE5_GARDEN_SCENE_ID = 'demo-garden';
export const PHASE5_HELPER_NPC_ID = 'helper-npc';
export const PHASE5_GARDEN_TASK_ID = 'garden-delivery';

const PLAYER_GROUNDED_Y = 0.9;
const NPC_GROUNDED_Y = 0.87;

export const PHASE5_SCENES = [
  {
    id: PHASE5_INITIAL_SCENE_ID,
    playerSpawn: {
      position: { x: 0, y: PLAYER_GROUNDED_Y, z: 4.1 },
      facing: 0,
    },
    stage: {
      width: 18,
      depth: 14,
      floorThickness: 0.4,
      wallThickness: 0.55,
      wallHeight: 1.65,
      floorColor: 0xf1e8d7,
      wallColor: 0x8bb8b4,
      obstacles: [
        {
          kind: 'table',
          position: { x: -3.6, y: 0.75, z: -1.5 },
          size: { x: 3.4, y: 1.5, z: 1.5 },
          color: 0xc98956,
        },
        {
          kind: 'table',
          position: { x: 3.5, y: 0.7, z: 2 },
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
      ],
      items: [
        { id: 'room-tomato', kind: 'tomato', position: { x: -2.4, y: 0, z: 3.9 } },
        { id: 'room-parcel', kind: 'box', position: { x: 1.55, y: 0, z: 2.55 } },
        { id: 'room-plate', kind: 'plate', position: { x: -1.8, y: 0, z: 2.5 } },
      ],
      placePoints: [
        { id: 'room-table-point', position: { x: -3.6, y: 1.515, z: -1.5 } },
        { id: 'room-counter-left', position: { x: 3.1, y: 1.415, z: 2 } },
        { id: 'room-counter-right', position: { x: 3.9, y: 1.415, z: 2 } },
      ],
    },
    npcs: [
      {
        id: PHASE5_HELPER_NPC_ID,
        displayName: 'Helper',
        position: { x: 0, y: NPC_GROUNDED_Y, z: 5.25 },
        moveSpeed: 1.8,
        turnSharpness: 10,
      },
    ],
    placementTasks: [],
  },
  {
    id: PHASE5_GARDEN_SCENE_ID,
    playerSpawn: {
      position: { x: 0, y: PLAYER_GROUNDED_Y, z: 4.2 },
      facing: 0,
    },
    stage: {
      width: 16,
      depth: 12,
      floorThickness: 0.4,
      wallThickness: 0.5,
      wallHeight: 1.55,
      floorColor: 0xdde9cc,
      wallColor: 0x76a98e,
      obstacles: [
        {
          kind: 'table',
          position: { x: 3.2, y: 0.7, z: 0.7 },
          size: { x: 3, y: 1.4, z: 1.3 },
          color: 0x6fa778,
        },
        {
          kind: 'table',
          position: { x: -3.5, y: 0.65, z: -1.8 },
          size: { x: 2.8, y: 1.3, z: 1.2 },
          color: 0xa97856,
        },
        {
          kind: 'box',
          position: { x: 0, y: 0.6, z: -2.4 },
          size: { x: 1.2, y: 1.2, z: 1.2 },
          color: 0xe19a68,
        },
        {
          kind: 'box',
          position: { x: 5.6, y: 0.45, z: 3.2 },
          size: { x: 0.9, y: 0.9, z: 0.9 },
          color: 0x7aa5cf,
        },
        {
          kind: 'box',
          position: { x: -5.5, y: 0.5, z: 2.5 },
          size: { x: 1, y: 1, z: 1 },
          color: 0xd6b956,
        },
      ],
      items: [
        { id: 'garden-tomato', kind: 'tomato', position: { x: -2.4, y: 0, z: 3.25 } },
        { id: 'garden-parcel', kind: 'box', position: { x: 0.1, y: 0, z: 2.8 } },
        { id: 'garden-plate', kind: 'plate', position: { x: 1.6, y: 0, z: 3.1 } },
      ],
      placePoints: [
        { id: 'garden-counter-left', position: { x: 2.45, y: 1.415, z: 0.7 } },
        { id: 'garden-counter-center', position: { x: 3.2, y: 1.415, z: 0.7 } },
        { id: 'garden-counter-right', position: { x: 3.95, y: 1.415, z: 0.7 } },
      ],
    },
    npcs: [
      {
        id: PHASE5_HELPER_NPC_ID,
        displayName: 'Helper',
        position: { x: 0, y: NPC_GROUNDED_Y, z: 5 },
        moveSpeed: 1.8,
        turnSharpness: 10,
      },
    ],
    placementTasks: [
      {
        id: PHASE5_GARDEN_TASK_ID,
        label: 'Carry all 3 items to the garden counter',
        durationSeconds: 45,
        requiredItemIds: ['garden-tomato', 'garden-parcel', 'garden-plate'],
        targetPlacePointIds: [
          'garden-counter-left',
          'garden-counter-center',
          'garden-counter-right',
        ],
        attemptPlayerPosition: { x: 0, y: PLAYER_GROUNDED_Y, z: 4.2 },
        attemptPlayerFacing: 0,
      },
    ],
  },
] as const satisfies readonly SceneDefinition[];
