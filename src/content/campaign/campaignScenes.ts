import type { SceneDefinition } from '../../scene/SceneTypes';
import type { CampaignStoryDefinition } from './CampaignStoryTypes';
import {
  CAMPAIGN_ASSEMBLY_INPUT_A_ID,
  CAMPAIGN_ASSEMBLY_INPUT_B_ID,
  CAMPAIGN_ASSEMBLY_OUTPUT_ID,
  CAMPAIGN_ASSEMBLY_STATION_ID,
  CAMPAIGN_ASSEMBLY_TASK_ID,
  CAMPAIGN_BEDROOM_SCENE_ID,
  CAMPAIGN_CAFE_COMPLETE_SCENE_ID,
  CAMPAIGN_CAFE_DRINK_A_ID,
  CAMPAIGN_CAFE_DRINK_B_ID,
  CAMPAIGN_CAFE_PLACE_A_ID,
  CAMPAIGN_CAFE_PLACE_B_ID,
  CAMPAIGN_CAFE_PLACEMENT_TASK_ID,
  CAMPAIGN_CAFE_SCENE_ID,
  CAMPAIGN_COMPANION_NPC_ID,
  CAMPAIGN_ENDING_SCENE_ID,
  CAMPAIGN_PARK_FIRST_REACH_TASK_ID,
  CAMPAIGN_PARK_SCENE_ID,
  CAMPAIGN_PARK_SECOND_REACH_TASK_ID,
  CAMPAIGN_PREP_COMPLETE_SCENE_ID,
  CAMPAIGN_PREP_FRUIT_ID,
  CAMPAIGN_PREP_PACKET_ID,
  CAMPAIGN_PREP_PLACE_A_ID,
  CAMPAIGN_PREP_PLACE_B_ID,
  CAMPAIGN_PREP_PLACEMENT_TASK_ID,
  CAMPAIGN_PREP_SCENE_ID,
  CAMPAIGN_PROCESSING_STATION_ID,
  CAMPAIGN_PROCESSING_TASK_ID,
  CAMPAIGN_VIEWPOINT_COMPLETE_SCENE_ID,
  CAMPAIGN_VIEWPOINT_PLACE_ID,
  CAMPAIGN_VIEWPOINT_PLACEMENT_TASK_ID,
  CAMPAIGN_VIEWPOINT_SCENE_ID,
} from './campaignIds';

const PLAYER_GROUNDED_Y = 0.9;
const NPC_GROUNDED_Y = 0.87;

export function createCampaignScenes(
  story: CampaignStoryDefinition,
): readonly SceneDefinition[] {
const CAMPAIGN_BEDROOM_SCENE = {
  id: CAMPAIGN_BEDROOM_SCENE_ID,
  playerSpawn: {
    position: { x: 0, y: PLAYER_GROUNDED_Y, z: 4.8 },
    facing: 0,
  },
  stage: {
    width: 16,
    depth: 12,
    floorThickness: 0.4,
    wallThickness: 0.55,
    wallHeight: 1.55,
    floorColor: 0xe9e2ef,
    wallColor: 0x9a8bab,
    obstacles: [
      {
        kind: 'table',
        position: { x: -4.2, y: 0.45, z: -1.8 },
        size: { x: 3.2, y: 0.9, z: 4.4 },
        color: 0xb98f9e,
      },
      {
        kind: 'table',
        position: { x: 3.9, y: 0.65, z: -2.8 },
        size: { x: 2.7, y: 1.3, z: 1.4 },
        color: 0x8c79a0,
      },
      {
        kind: 'box',
        position: { x: 4.7, y: 0.65, z: 1.4 },
        size: { x: 1.3, y: 1.3, z: 1.3 },
        color: 0xd4b46d,
      },
    ],
    items: [],
    placePoints: [],
  },
  npcs: [],
  placementTasks: [],
} as const satisfies SceneDefinition;

const CAMPAIGN_CAFE_SCENE = {
  id: CAMPAIGN_CAFE_SCENE_ID,
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
    floorColor: 0xf0dfca,
    wallColor: 0xa87864,
    obstacles: [
      {
        kind: 'table',
        position: { x: -4.8, y: 0.65, z: 0.2 },
        size: { x: 2.6, y: 1.3, z: 1.6 },
        color: 0x7e5d4f,
      },
      {
        kind: 'table',
        position: { x: 3.5, y: 0.65, z: -0.4 },
        size: { x: 3.5, y: 1.3, z: 1.7 },
        color: 0x9f6d55,
      },
      {
        kind: 'box',
        position: { x: -6.7, y: 0.55, z: -3.8 },
        size: { x: 1.1, y: 1.1, z: 1.1 },
        color: 0x6e8b8e,
      },
      {
        kind: 'box',
        position: { x: 6.6, y: 0.55, z: 3.7 },
        size: { x: 1.1, y: 1.1, z: 1.1 },
        color: 0xc19d67,
      },
    ],
    items: [
      {
        id: CAMPAIGN_CAFE_DRINK_A_ID,
        kind: 'drink',
        position: { x: -1.1, y: 0, z: 4.3 },
      },
      {
        id: CAMPAIGN_CAFE_DRINK_B_ID,
        kind: 'drink',
        position: { x: 1.1, y: 0, z: 4.3 },
      },
    ],
    placePoints: [
      {
        id: CAMPAIGN_CAFE_PLACE_A_ID,
        position: { x: 3.05, y: 1.315, z: -0.4 },
      },
      {
        id: CAMPAIGN_CAFE_PLACE_B_ID,
        position: { x: 3.95, y: 1.315, z: -0.4 },
      },
    ],
  },
  npcs: [
    {
      id: CAMPAIGN_COMPANION_NPC_ID,
      displayName: story.companionDisplayName,
      position: { x: 0, y: NPC_GROUNDED_Y, z: 3.1 },
      moveSpeed: 1.8,
      turnSharpness: 10,
    },
  ],
  placementTasks: [
    {
      id: CAMPAIGN_CAFE_PLACEMENT_TASK_ID,
      label: story.meeting.placementTaskLabel,
      durationSeconds: 45,
      requiredItemIds: [CAMPAIGN_CAFE_DRINK_A_ID, CAMPAIGN_CAFE_DRINK_B_ID],
      targetPlacePointIds: [CAMPAIGN_CAFE_PLACE_A_ID, CAMPAIGN_CAFE_PLACE_B_ID],
      attemptPlayerPosition: { x: 0, y: PLAYER_GROUNDED_Y, z: 5.7 },
      attemptPlayerFacing: 0,
    },
  ],
} as const satisfies SceneDefinition;

const CAMPAIGN_CAFE_COMPLETE_SCENE = {
  ...CAMPAIGN_CAFE_SCENE,
  id: CAMPAIGN_CAFE_COMPLETE_SCENE_ID,
  stage: {
    ...CAMPAIGN_CAFE_SCENE.stage,
    items: [
      {
        ...CAMPAIGN_CAFE_SCENE.stage.items[0],
        position: { x: 3.05, y: 1.315, z: -0.4 },
      },
      {
        ...CAMPAIGN_CAFE_SCENE.stage.items[1],
        position: { x: 3.95, y: 1.315, z: -0.4 },
      },
    ],
  },
  placementTasks: [],
} as const satisfies SceneDefinition;

const CAMPAIGN_PARK_SCENE = {
  id: CAMPAIGN_PARK_SCENE_ID,
  playerSpawn: {
    position: { x: 0, y: PLAYER_GROUNDED_Y, z: 6.2 },
    facing: 0,
  },
  stage: {
    width: 20,
    depth: 16,
    floorThickness: 0.4,
    wallThickness: 0.55,
    wallHeight: 1.45,
    floorColor: 0xdce9d4,
    wallColor: 0x7fa07c,
    obstacles: [
      {
        kind: 'box',
        position: { x: 0, y: 0.7, z: 0.2 },
        size: { x: 2.2, y: 1.4, z: 2.2 },
        color: 0x6f9caf,
      },
      {
        kind: 'table',
        position: { x: -5.8, y: 0.55, z: 1.4 },
        size: { x: 2.8, y: 1.1, z: 1.1 },
        color: 0x987253,
      },
      {
        kind: 'table',
        position: { x: 5.6, y: 0.55, z: -3.9 },
        size: { x: 2.8, y: 1.1, z: 1.1 },
        color: 0x987253,
      },
      {
        kind: 'box',
        position: { x: -7.7, y: 0.7, z: -5.5 },
        size: { x: 1.4, y: 1.4, z: 1.4 },
        color: 0x6c8f66,
      },
      {
        kind: 'box',
        position: { x: 7.7, y: 0.7, z: 4.9 },
        size: { x: 1.4, y: 1.4, z: 1.4 },
        color: 0x6c8f66,
      },
    ],
    items: [],
    placePoints: [],
  },
  npcs: [
    {
      id: CAMPAIGN_COMPANION_NPC_ID,
      displayName: story.companionDisplayName,
      position: { x: 0, y: NPC_GROUNDED_Y, z: 4.8 },
      moveSpeed: 2,
      turnSharpness: 10,
    },
  ],
  placementTasks: [],
  reachTasks: [
    {
      id: CAMPAIGN_PARK_FIRST_REACH_TASK_ID,
      label: story.outing.firstReachTaskLabel,
      targetPosition: { x: -3.2, y: 0.03, z: 0.8 },
      radius: 1.15,
    },
    {
      id: CAMPAIGN_PARK_SECOND_REACH_TASK_ID,
      label: story.outing.secondReachTaskLabel,
      targetPosition: { x: 4.5, y: 0.03, z: -4.1 },
      radius: 1.15,
    },
  ],
} as const satisfies SceneDefinition;

const CAMPAIGN_PREP_SCENE = {
  id: CAMPAIGN_PREP_SCENE_ID,
  playerSpawn: {
    position: { x: 0, y: PLAYER_GROUNDED_Y, z: 5.5 },
    facing: 0,
  },
  stage: {
    width: 18,
    depth: 14,
    floorThickness: 0.4,
    wallThickness: 0.55,
    wallHeight: 1.55,
    floorColor: 0xeee3cf,
    wallColor: 0x85a48c,
    obstacles: [
      {
        kind: 'table',
        position: { x: -3.8, y: 0.65, z: 0.4 },
        size: { x: 3.2, y: 1.3, z: 1.5 },
        color: 0x6f927d,
      },
      {
        kind: 'table',
        position: { x: 3.8, y: 0.65, z: 0.4 },
        size: { x: 3.2, y: 1.3, z: 1.5 },
        color: 0xa97a57,
      },
      {
        kind: 'box',
        position: { x: 0, y: 0.6, z: -3.7 },
        size: { x: 1.2, y: 1.2, z: 1.2 },
        color: 0xc99d5f,
      },
      {
        kind: 'box',
        position: { x: -6.7, y: 0.55, z: -3.8 },
        size: { x: 1.1, y: 1.1, z: 1.1 },
        color: 0x668c72,
      },
      {
        kind: 'box',
        position: { x: 6.7, y: 0.55, z: -3.8 },
        size: { x: 1.1, y: 1.1, z: 1.1 },
        color: 0x6d8fa8,
      },
    ],
    items: [
      {
        id: CAMPAIGN_PREP_FRUIT_ID,
        kind: 'tomato',
        position: { x: -1.2, y: 0, z: 4.2 },
      },
      {
        id: CAMPAIGN_PREP_PACKET_ID,
        kind: 'box',
        position: { x: 1.2, y: 0, z: 4.2 },
      },
    ],
    placePoints: [
      {
        id: CAMPAIGN_PREP_PLACE_A_ID,
        position: { x: 3.35, y: 1.315, z: 0.4 },
      },
      {
        id: CAMPAIGN_PREP_PLACE_B_ID,
        position: { x: 4.25, y: 1.315, z: 0.4 },
      },
    ],
  },
  npcs: [
    {
      id: CAMPAIGN_COMPANION_NPC_ID,
      displayName: story.companionDisplayName,
      position: { x: 0, y: NPC_GROUNDED_Y, z: 3.1 },
      moveSpeed: 1.8,
      turnSharpness: 10,
    },
  ],
  placementTasks: [
    {
      id: CAMPAIGN_PREP_PLACEMENT_TASK_ID,
      label: story.preparation.placementTaskLabel,
      durationSeconds: 45,
      requiredItemIds: [CAMPAIGN_PREP_FRUIT_ID, CAMPAIGN_PREP_PACKET_ID],
      targetPlacePointIds: [CAMPAIGN_PREP_PLACE_A_ID, CAMPAIGN_PREP_PLACE_B_ID],
      attemptPlayerPosition: { x: 0, y: PLAYER_GROUNDED_Y, z: 5.5 },
      attemptPlayerFacing: 0,
      preserveWorldOnFirstAttempt: true,
      preserveItemProcessingOnRetry: true,
    },
  ],
  processingStations: [
    {
      id: CAMPAIGN_PROCESSING_STATION_ID,
      position: { x: -3.8, y: 1.315, z: 0.4 },
      processingDurationSeconds: 1.8,
      acceptedItemIds: [CAMPAIGN_PREP_FRUIT_ID, CAMPAIGN_PREP_PACKET_ID],
    },
  ],
  processingTasks: [
    {
      id: CAMPAIGN_PROCESSING_TASK_ID,
      label: story.preparation.processingTaskLabel,
      requiredItemIds: [CAMPAIGN_PREP_FRUIT_ID, CAMPAIGN_PREP_PACKET_ID],
      stationIds: [CAMPAIGN_PROCESSING_STATION_ID],
      durationSeconds: 55,
      attemptPlayerPosition: { x: 0, y: PLAYER_GROUNDED_Y, z: 5.5 },
      attemptPlayerFacing: 0,
    },
  ],
} as const satisfies SceneDefinition;

const CAMPAIGN_PREP_COMPLETE_SCENE = {
  ...CAMPAIGN_PREP_SCENE,
  id: CAMPAIGN_PREP_COMPLETE_SCENE_ID,
  stage: {
    ...CAMPAIGN_PREP_SCENE.stage,
    items: [
      {
        ...CAMPAIGN_PREP_SCENE.stage.items[0],
        position: { x: 3.35, y: 1.315, z: 0.4 },
        initialProcessingState: 'processed',
      },
      {
        ...CAMPAIGN_PREP_SCENE.stage.items[1],
        position: { x: 4.25, y: 1.315, z: 0.4 },
        initialProcessingState: 'processed',
      },
    ],
  },
  placementTasks: [],
  processingStations: [],
  processingTasks: [],
} as const satisfies SceneDefinition;

const CAMPAIGN_VIEWPOINT_SCENE = {
  id: CAMPAIGN_VIEWPOINT_SCENE_ID,
  playerSpawn: {
    position: { x: 0, y: PLAYER_GROUNDED_Y, z: 5.7 },
    facing: 0,
  },
  stage: {
    width: 18,
    depth: 14,
    floorThickness: 0.4,
    wallThickness: 0.55,
    wallHeight: 1.45,
    floorColor: 0xe1e7ef,
    wallColor: 0x7488a5,
    obstacles: [
      {
        kind: 'table',
        position: { x: -3.8, y: 0.65, z: 0.4 },
        size: { x: 3.3, y: 1.3, z: 1.5 },
        color: 0x687fa4,
      },
      {
        kind: 'table',
        position: { x: 3.8, y: 0.65, z: -1.8 },
        size: { x: 3.2, y: 1.3, z: 1.6 },
        color: 0x9b785e,
      },
      {
        kind: 'box',
        position: { x: 0, y: 0.7, z: -4.2 },
        size: { x: 1.4, y: 1.4, z: 1.4 },
        color: 0xd0ad68,
      },
      {
        kind: 'box',
        position: { x: -7, y: 0.55, z: -3.7 },
        size: { x: 1.1, y: 1.1, z: 1.1 },
        color: 0x748fab,
      },
      {
        kind: 'box',
        position: { x: 7, y: 0.55, z: 3.7 },
        size: { x: 1.1, y: 1.1, z: 1.1 },
        color: 0x94799f,
      },
    ],
    items: [
      {
        id: CAMPAIGN_ASSEMBLY_INPUT_A_ID,
        kind: 'box',
        position: { x: -1.2, y: 0, z: 4.2 },
      },
      {
        id: CAMPAIGN_ASSEMBLY_INPUT_B_ID,
        kind: 'drink',
        position: { x: 1.2, y: 0, z: 4.2 },
      },
      {
        id: CAMPAIGN_ASSEMBLY_OUTPUT_ID,
        kind: 'bundle',
        position: { x: 0, y: 0, z: 3.2 },
        initialActive: false,
      },
    ],
    placePoints: [
      {
        id: CAMPAIGN_VIEWPOINT_PLACE_ID,
        position: { x: 3.8, y: 1.315, z: -1.8 },
      },
    ],
  },
  npcs: [
    {
      id: CAMPAIGN_COMPANION_NPC_ID,
      displayName: story.companionDisplayName,
      position: { x: 0, y: NPC_GROUNDED_Y, z: 3.1 },
      moveSpeed: 1.8,
      turnSharpness: 10,
    },
  ],
  placementTasks: [
    {
      id: CAMPAIGN_VIEWPOINT_PLACEMENT_TASK_ID,
      label: story.journey.placementTaskLabel,
      durationSeconds: 45,
      requiredItemIds: [CAMPAIGN_ASSEMBLY_OUTPUT_ID],
      targetPlacePointIds: [CAMPAIGN_VIEWPOINT_PLACE_ID],
      attemptPlayerPosition: { x: 0, y: PLAYER_GROUNDED_Y, z: 5.7 },
      attemptPlayerFacing: 0,
      preserveWorldOnFirstAttempt: true,
      preserveItemRuntimeOnRetry: true,
    },
  ],
  assemblyStations: [
    {
      id: CAMPAIGN_ASSEMBLY_STATION_ID,
      position: { x: -3.8, y: 1.315, z: 0.4 },
      inputItemIds: [CAMPAIGN_ASSEMBLY_INPUT_A_ID, CAMPAIGN_ASSEMBLY_INPUT_B_ID],
      outputItemId: CAMPAIGN_ASSEMBLY_OUTPUT_ID,
      combineDurationSeconds: 1.8,
    },
  ],
  assemblyTasks: [
    {
      id: CAMPAIGN_ASSEMBLY_TASK_ID,
      label: story.journey.assemblyTaskLabel,
      stationIds: [CAMPAIGN_ASSEMBLY_STATION_ID],
      durationSeconds: 55,
      attemptPlayerPosition: { x: 0, y: PLAYER_GROUNDED_Y, z: 5.7 },
      attemptPlayerFacing: 0,
    },
  ],
} as const satisfies SceneDefinition;

const CAMPAIGN_VIEWPOINT_COMPLETE_SCENE = {
  ...CAMPAIGN_VIEWPOINT_SCENE,
  id: CAMPAIGN_VIEWPOINT_COMPLETE_SCENE_ID,
  stage: {
    ...CAMPAIGN_VIEWPOINT_SCENE.stage,
    items: [
      {
        ...CAMPAIGN_VIEWPOINT_SCENE.stage.items[0],
        initialActive: false,
      },
      {
        ...CAMPAIGN_VIEWPOINT_SCENE.stage.items[1],
        initialActive: false,
      },
      {
        ...CAMPAIGN_VIEWPOINT_SCENE.stage.items[2],
        position: { x: 3.8, y: 1.315, z: -1.8 },
        initialActive: true,
      },
    ],
  },
  placementTasks: [],
  assemblyStations: [],
  assemblyTasks: [],
} as const satisfies SceneDefinition;

const CAMPAIGN_ENDING_SCENE = {
  id: CAMPAIGN_ENDING_SCENE_ID,
  playerSpawn: {
    position: { x: 0, y: PLAYER_GROUNDED_Y, z: 4.8 },
    facing: 0,
  },
  stage: {
    width: 16,
    depth: 12,
    floorThickness: 0.4,
    wallThickness: 0.55,
    wallHeight: 1.55,
    floorColor: 0xeee4df,
    wallColor: 0xa37d89,
    obstacles: [
      {
        kind: 'table',
        position: { x: 0, y: 0.65, z: -2.6 },
        size: { x: 5.2, y: 1.3, z: 1.5 },
        color: 0x8f6d78,
      },
      {
        kind: 'box',
        position: { x: -4.7, y: 0.75, z: -1.2 },
        size: { x: 1.5, y: 1.5, z: 1.5 },
        color: 0xd2ad6d,
      },
      {
        kind: 'box',
        position: { x: 4.7, y: 0.75, z: -1.2 },
        size: { x: 1.5, y: 1.5, z: 1.5 },
        color: 0x7997a9,
      },
    ],
    items: [],
    placePoints: [],
  },
  npcs: [
    {
      id: CAMPAIGN_COMPANION_NPC_ID,
      displayName: story.companionDisplayName,
      position: { x: 0, y: NPC_GROUNDED_Y, z: 2.4 },
      moveSpeed: 1.8,
      turnSharpness: 10,
    },
  ],
  placementTasks: [],
} as const satisfies SceneDefinition;

return [
  CAMPAIGN_BEDROOM_SCENE,
  CAMPAIGN_CAFE_SCENE,
  CAMPAIGN_CAFE_COMPLETE_SCENE,
  CAMPAIGN_PARK_SCENE,
  CAMPAIGN_PREP_SCENE,
  CAMPAIGN_PREP_COMPLETE_SCENE,
  CAMPAIGN_VIEWPOINT_SCENE,
  CAMPAIGN_VIEWPOINT_COMPLETE_SCENE,
  CAMPAIGN_ENDING_SCENE,
] as const satisfies readonly SceneDefinition[];
}
