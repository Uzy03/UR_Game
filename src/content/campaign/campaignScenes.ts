import type { SceneDefinition } from '../../scene/SceneTypes';
import type { CampaignStoryDefinition } from './CampaignStoryTypes';
import {
  CAMPAIGN_BEDROOM_DECORATIONS,
  CAMPAIGN_BEDROOM_PALETTE,
  CAMPAIGN_BEDROOM_VISUAL_STYLE,
  CAMPAIGN_CAFE_DECORATIONS,
  CAMPAIGN_CAFE_PALETTE,
  CAMPAIGN_CAFE_VISUAL_STYLE,
  CAMPAIGN_ENDING_DECORATIONS,
  CAMPAIGN_ENDING_PALETTE,
  CAMPAIGN_ENDING_VISUAL_STYLE,
  CAMPAIGN_PARK_DECORATIONS,
  CAMPAIGN_PARK_PALETTE,
  CAMPAIGN_PARK_VISUAL_STYLE,
  CAMPAIGN_PREP_DECORATIONS,
  CAMPAIGN_PREP_PALETTE,
  CAMPAIGN_PREP_VISUAL_STYLE,
  CAMPAIGN_VIEWPOINT_DECORATIONS,
  CAMPAIGN_VIEWPOINT_PALETTE,
  CAMPAIGN_VIEWPOINT_VISUAL_STYLE,
} from './campaignVisualStyle';
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
    floorColor: CAMPAIGN_BEDROOM_PALETTE.floor,
    wallColor: CAMPAIGN_BEDROOM_PALETTE.wall,
    visualStyle: CAMPAIGN_BEDROOM_VISUAL_STYLE,
    decorations: CAMPAIGN_BEDROOM_DECORATIONS,
    obstacles: [
      {
        kind: 'table',
        position: { x: -4.2, y: 0.45, z: -1.8 },
        size: { x: 3.2, y: 0.9, z: 4.4 },
        color: CAMPAIGN_BEDROOM_PALETTE.lightWood,
      },
      {
        kind: 'table',
        position: { x: 3.9, y: 0.65, z: -2.8 },
        size: { x: 2.7, y: 1.3, z: 1.4 },
        color: CAMPAIGN_BEDROOM_PALETTE.darkWood,
      },
      {
        kind: 'box',
        position: { x: 4.7, y: 0.65, z: 1.4 },
        size: { x: 1.3, y: 1.3, z: 1.3 },
        color: CAMPAIGN_BEDROOM_PALETTE.gold,
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
    floorColor: CAMPAIGN_CAFE_PALETTE.floor,
    wallColor: CAMPAIGN_CAFE_PALETTE.wall,
    visualStyle: CAMPAIGN_CAFE_VISUAL_STYLE,
    decorations: CAMPAIGN_CAFE_DECORATIONS,
    obstacles: [
      {
        kind: 'table',
        position: { x: -4.8, y: 0.65, z: 0.2 },
        size: { x: 2.6, y: 1.3, z: 1.6 },
        color: CAMPAIGN_CAFE_PALETTE.darkWood,
      },
      {
        kind: 'table',
        position: { x: 3.5, y: 0.65, z: -0.4 },
        size: { x: 3.5, y: 1.3, z: 1.7 },
        color: CAMPAIGN_CAFE_PALETTE.warmWood,
      },
      {
        kind: 'box',
        position: { x: -6.7, y: 0.55, z: -3.8 },
        size: { x: 1.1, y: 1.1, z: 1.1 },
        color: CAMPAIGN_CAFE_PALETTE.dustyBlue,
      },
      {
        kind: 'box',
        position: { x: 6.6, y: 0.55, z: 3.7 },
        size: { x: 1.1, y: 1.1, z: 1.1 },
        color: CAMPAIGN_CAFE_PALETTE.softGold,
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
    floorColor: CAMPAIGN_PARK_PALETTE.floor,
    wallColor: CAMPAIGN_PARK_PALETTE.wall,
    visualStyle: CAMPAIGN_PARK_VISUAL_STYLE,
    decorations: CAMPAIGN_PARK_DECORATIONS,
    obstacles: [
      {
        kind: 'box',
        position: { x: 0, y: 0.7, z: 0.2 },
        size: { x: 2.2, y: 1.4, z: 2.2 },
        color: CAMPAIGN_PARK_PALETTE.skyBlue,
      },
      {
        kind: 'table',
        position: { x: -5.8, y: 0.55, z: 1.4 },
        size: { x: 2.8, y: 1.1, z: 1.1 },
        color: CAMPAIGN_PARK_PALETTE.wood,
      },
      {
        kind: 'table',
        position: { x: 5.6, y: 0.55, z: -3.9 },
        size: { x: 2.8, y: 1.1, z: 1.1 },
        color: CAMPAIGN_PARK_PALETTE.wood,
      },
      {
        kind: 'box',
        position: { x: -7.7, y: 0.7, z: -5.5 },
        size: { x: 1.4, y: 1.4, z: 1.4 },
        color: CAMPAIGN_PARK_PALETTE.deepGreen,
      },
      {
        kind: 'box',
        position: { x: 7.7, y: 0.7, z: 4.9 },
        size: { x: 1.4, y: 1.4, z: 1.4 },
        color: CAMPAIGN_PARK_PALETTE.deepGreen,
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
    floorColor: CAMPAIGN_PREP_PALETTE.floor,
    wallColor: CAMPAIGN_PREP_PALETTE.wall,
    visualStyle: CAMPAIGN_PREP_VISUAL_STYLE,
    decorations: CAMPAIGN_PREP_DECORATIONS,
    obstacles: [
      {
        kind: 'table',
        position: { x: -3.8, y: 0.65, z: 0.4 },
        size: { x: 3.2, y: 1.3, z: 1.5 },
        color: CAMPAIGN_PREP_PALETTE.dustyBlue,
      },
      {
        kind: 'table',
        position: { x: 3.8, y: 0.65, z: 0.4 },
        size: { x: 3.2, y: 1.3, z: 1.5 },
        color: CAMPAIGN_PREP_PALETTE.warmWood,
      },
      {
        kind: 'box',
        position: { x: 0, y: 0.6, z: -3.7 },
        size: { x: 1.2, y: 1.2, z: 1.2 },
        color: CAMPAIGN_PREP_PALETTE.terracotta,
      },
      {
        kind: 'box',
        position: { x: -6.7, y: 0.55, z: -3.8 },
        size: { x: 1.1, y: 1.1, z: 1.1 },
        color: CAMPAIGN_PREP_PALETTE.sage,
      },
      {
        kind: 'box',
        position: { x: 6.7, y: 0.55, z: -3.8 },
        size: { x: 1.1, y: 1.1, z: 1.1 },
        color: CAMPAIGN_PREP_PALETTE.darkBlue,
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
    floorColor: CAMPAIGN_VIEWPOINT_PALETTE.floor,
    wallColor: CAMPAIGN_VIEWPOINT_PALETTE.wall,
    visualStyle: CAMPAIGN_VIEWPOINT_VISUAL_STYLE,
    decorations: CAMPAIGN_VIEWPOINT_DECORATIONS,
    obstacles: [
      {
        kind: 'table',
        position: { x: -3.8, y: 0.65, z: 0.4 },
        size: { x: 3.3, y: 1.3, z: 1.5 },
        color: CAMPAIGN_VIEWPOINT_PALETTE.dustyBlue,
      },
      {
        kind: 'table',
        position: { x: 3.8, y: 0.65, z: -1.8 },
        size: { x: 3.2, y: 1.3, z: 1.6 },
        color: CAMPAIGN_VIEWPOINT_PALETTE.darkWood,
      },
      {
        kind: 'box',
        position: { x: 0, y: 0.7, z: -4.2 },
        size: { x: 1.4, y: 1.4, z: 1.4 },
        color: CAMPAIGN_VIEWPOINT_PALETTE.amber,
      },
      {
        kind: 'box',
        position: { x: -7, y: 0.55, z: -3.7 },
        size: { x: 1.1, y: 1.1, z: 1.1 },
        color: CAMPAIGN_VIEWPOINT_PALETTE.dustyBlue,
      },
      {
        kind: 'box',
        position: { x: 7, y: 0.55, z: 3.7 },
        size: { x: 1.1, y: 1.1, z: 1.1 },
        color: CAMPAIGN_VIEWPOINT_PALETTE.mutedPurple,
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
    floorColor: CAMPAIGN_ENDING_PALETTE.floor,
    wallColor: CAMPAIGN_ENDING_PALETTE.wall,
    visualStyle: CAMPAIGN_ENDING_VISUAL_STYLE,
    decorations: CAMPAIGN_ENDING_DECORATIONS,
    obstacles: [
      {
        kind: 'table',
        position: { x: 0, y: 0.65, z: -2.6 },
        size: { x: 5.2, y: 1.3, z: 1.5 },
        color: CAMPAIGN_ENDING_PALETTE.darkWood,
      },
      {
        kind: 'box',
        position: { x: -4.7, y: 0.75, z: -1.2 },
        size: { x: 1.5, y: 1.5, z: 1.5 },
        color: CAMPAIGN_ENDING_PALETTE.gold,
      },
      {
        kind: 'box',
        position: { x: 4.7, y: 0.75, z: -1.2 },
        size: { x: 1.5, y: 1.5, z: 1.5 },
        color: CAMPAIGN_ENDING_PALETTE.dustyBlue,
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
