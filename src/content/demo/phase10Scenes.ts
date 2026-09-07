import type { SceneDefinition } from '../../scene/SceneTypes';
import { PHASE9_SCENES } from './phase9Scenes';
import {
  PHASE10_ASSEMBLY_SCENE_ID,
  PHASE10_ASSEMBLY_TASK_ID,
  PHASE10_COMPANION_NPC_ID,
  PHASE10_COMPLETE_SCENE_ID,
  PHASE10_PLACEMENT_TASK_ID,
  PHASE10_STATION_ID,
} from './phase10Ids';

const PLAYER_GROUNDED_Y = 0.9;
const NPC_GROUNDED_Y = 0.87;
const COMPONENT_A_ID = 'demo-assembly-component-a';
const COMPONENT_B_ID = 'demo-assembly-component-b';
const OUTPUT_ITEM_ID = 'demo-assembly-bundle';
const FINAL_PLACE_POINT_ID = 'demo-assembly-final-table';

const PHASE10_ASSEMBLY_SCENE = {
  id: PHASE10_ASSEMBLY_SCENE_ID,
  playerSpawn: {
    position: { x: 0, y: PLAYER_GROUNDED_Y, z: 5.7 },
    facing: 0,
  },
  stage: {
    width: 18,
    depth: 14,
    floorThickness: 0.4,
    wallThickness: 0.55,
    wallHeight: 1.55,
    floorColor: 0xe7e5ef,
    wallColor: 0x8f9ab8,
    obstacles: [
      {
        kind: 'table',
        position: { x: -3.8, y: 0.65, z: 0.5 },
        size: { x: 3.3, y: 1.3, z: 1.5 },
        color: 0x7386ad,
      },
      {
        kind: 'table',
        position: { x: 3.8, y: 0.65, z: 0.5 },
        size: { x: 3.2, y: 1.3, z: 1.5 },
        color: 0xa77d62,
      },
      {
        kind: 'box',
        position: { x: 0, y: 0.55, z: -3.5 },
        size: { x: 1.1, y: 1.1, z: 1.1 },
        color: 0xc8a45d,
      },
      {
        kind: 'box',
        position: { x: -6.6, y: 0.5, z: -3.9 },
        size: { x: 1, y: 1, z: 1 },
        color: 0x748fab,
      },
      {
        kind: 'box',
        position: { x: 6.6, y: 0.5, z: -3.9 },
        size: { x: 1, y: 1, z: 1 },
        color: 0x9c779e,
      },
    ],
    items: [
      {
        id: COMPONENT_A_ID,
        kind: 'box',
        position: { x: -1.25, y: 0, z: 4.2 },
      },
      {
        id: COMPONENT_B_ID,
        kind: 'drink',
        position: { x: 1.2, y: 0, z: 4.2 },
      },
      {
        id: OUTPUT_ITEM_ID,
        kind: 'bundle',
        position: { x: 0, y: 0, z: 3.25 },
        initialActive: false,
      },
    ],
    placePoints: [
      {
        id: FINAL_PLACE_POINT_ID,
        position: { x: 3.8, y: 1.315, z: 0.5 },
      },
    ],
  },
  npcs: [
    {
      id: PHASE10_COMPANION_NPC_ID,
      displayName: 'Demo Maker',
      position: { x: 0, y: NPC_GROUNDED_Y, z: 4.9 },
      moveSpeed: 1.8,
      turnSharpness: 10,
    },
  ],
  placementTasks: [
    {
      id: PHASE10_PLACEMENT_TASK_ID,
      label: 'Bring the finished bundle to the table',
      durationSeconds: 30,
      requiredItemIds: [OUTPUT_ITEM_ID],
      targetPlacePointIds: [FINAL_PLACE_POINT_ID],
      attemptPlayerPosition: { x: 0, y: PLAYER_GROUNDED_Y, z: 5.7 },
      attemptPlayerFacing: 0,
      preserveWorldOnFirstAttempt: true,
      preserveItemRuntimeOnRetry: true,
    },
  ],
  assemblyStations: [
    {
      id: PHASE10_STATION_ID,
      position: { x: -3.8, y: 1.315, z: 0.5 },
      inputItemIds: [COMPONENT_A_ID, COMPONENT_B_ID],
      outputItemId: OUTPUT_ITEM_ID,
      combineDurationSeconds: 1.8,
    },
  ],
  assemblyTasks: [
    {
      id: PHASE10_ASSEMBLY_TASK_ID,
      label: 'Combine the two demo components',
      stationIds: [PHASE10_STATION_ID],
      durationSeconds: 45,
      attemptPlayerPosition: { x: 0, y: PLAYER_GROUNDED_Y, z: 5.7 },
      attemptPlayerFacing: 0,
    },
  ],
} as const satisfies SceneDefinition;

const PHASE10_COMPLETE_SCENE = {
  ...PHASE10_ASSEMBLY_SCENE,
  id: PHASE10_COMPLETE_SCENE_ID,
  stage: {
    ...PHASE10_ASSEMBLY_SCENE.stage,
    items: [
      {
        ...PHASE10_ASSEMBLY_SCENE.stage.items[0],
        initialActive: false,
      },
      {
        ...PHASE10_ASSEMBLY_SCENE.stage.items[1],
        initialActive: false,
      },
      {
        ...PHASE10_ASSEMBLY_SCENE.stage.items[2],
        position: { x: 3.8, y: 1.315, z: 0.5 },
        initialActive: true,
      },
    ],
  },
  placementTasks: [],
  assemblyStations: [],
  assemblyTasks: [],
} as const satisfies SceneDefinition;

const PHASE10_NEW_SCENES = [
  PHASE10_ASSEMBLY_SCENE,
  PHASE10_COMPLETE_SCENE,
] as const satisfies readonly SceneDefinition[];

// Legacy Scenes remain registered so every v1 Checkpoint can be reconstructed.
export const PHASE10_SCENES = [
  ...PHASE9_SCENES,
  ...PHASE10_NEW_SCENES,
] as const satisfies readonly SceneDefinition[];
