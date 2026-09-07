import type {
  StageDecorationDefinition,
  StageVisualStyleDefinition,
} from '../../stage/StageTypes';

export const CAMPAIGN_CAFE_PALETTE = {
  floor: 0xe5d2b8,
  floorLine: 0xd4bea0,
  wall: 0xb97868,
  wallTrim: 0x8e5c50,
  darkWood: 0x765044,
  warmWood: 0x9b6b52,
  sage: 0x78906f,
  dustyBlue: 0x718e9a,
  cream: 0xf1e6d2,
  softGold: 0xd8b66d,
  plinth: 0x684c42,
} as const;

export const CAMPAIGN_CAFE_VISUAL_STYLE = {
  plinthColor: CAMPAIGN_CAFE_PALETTE.plinth,
  floorLineColor: CAMPAIGN_CAFE_PALETTE.floorLine,
  wallTrimColor: CAMPAIGN_CAFE_PALETTE.wallTrim,
} as const satisfies StageVisualStyleDefinition;

export const CAMPAIGN_CAFE_DECORATIONS = [
  {
    kind: 'rug',
    position: { x: 0, y: 0, z: -0.4 },
    scale: { x: 1.1, y: 1, z: 1.1 },
    primaryColor: 0x9aa9a0,
    secondaryColor: 0xe3c98d,
  },
  {
    kind: 'plant',
    position: { x: -6.7, y: 1.1, z: -3.8 },
    primaryColor: CAMPAIGN_CAFE_PALETTE.sage,
    secondaryColor: 0xa76555,
  },
  {
    kind: 'plant',
    position: { x: 6.6, y: 1.1, z: 3.7 },
    primaryColor: 0x6f8970,
    secondaryColor: 0xb47b60,
  },
  {
    kind: 'wall-art',
    position: { x: -2.6, y: 0.95, z: -6.88 },
    primaryColor: 0xd8a887,
    secondaryColor: CAMPAIGN_CAFE_PALETTE.darkWood,
  },
  {
    kind: 'wall-art',
    position: { x: -0.9, y: 0.95, z: -6.88 },
    primaryColor: CAMPAIGN_CAFE_PALETTE.dustyBlue,
    secondaryColor: CAMPAIGN_CAFE_PALETTE.darkWood,
  },
  {
    kind: 'shelf',
    position: { x: 4.9, y: 0.82, z: -6.74 },
    primaryColor: CAMPAIGN_CAFE_PALETTE.darkWood,
    secondaryColor: CAMPAIGN_CAFE_PALETTE.cream,
  },
  {
    kind: 'table-setting',
    position: { x: -4.8, y: 1.325, z: 0.2 },
    primaryColor: CAMPAIGN_CAFE_PALETTE.cream,
    secondaryColor: CAMPAIGN_CAFE_PALETTE.dustyBlue,
  },
  {
    kind: 'table-setting',
    position: { x: 2.25, y: 1.325, z: -0.4 },
    primaryColor: CAMPAIGN_CAFE_PALETTE.cream,
    secondaryColor: 0xc87864,
  },
  {
    kind: 'table-setting',
    position: { x: 4.75, y: 1.325, z: -0.4 },
    rotationY: Math.PI,
    primaryColor: CAMPAIGN_CAFE_PALETTE.cream,
    secondaryColor: CAMPAIGN_CAFE_PALETTE.sage,
  },
  {
    kind: 'pendant',
    position: { x: -4.8, y: 2.45, z: 0.2 },
    primaryColor: CAMPAIGN_CAFE_PALETTE.softGold,
    secondaryColor: CAMPAIGN_CAFE_PALETTE.darkWood,
  },
] as const satisfies readonly StageDecorationDefinition[];

export const CAMPAIGN_BEDROOM_PALETTE = {
  floor: 0xeadccf,
  floorLine: 0xd9c6b8,
  wall: 0xc98f91,
  wallTrim: 0x9a676b,
  cream: 0xf4eadc,
  blush: 0xdca6a5,
  dustyPink: 0xb97882,
  lightWood: 0xb98b68,
  darkWood: 0x755247,
  sage: 0x829178,
  gold: 0xd5ae68,
  plinth: 0x75584d,
} as const;

export const CAMPAIGN_BEDROOM_VISUAL_STYLE = {
  plinthColor: CAMPAIGN_BEDROOM_PALETTE.plinth,
  floorLineColor: CAMPAIGN_BEDROOM_PALETTE.floorLine,
  wallTrimColor: CAMPAIGN_BEDROOM_PALETTE.wallTrim,
} as const satisfies StageVisualStyleDefinition;

export const CAMPAIGN_BEDROOM_DECORATIONS = [
  {
    kind: 'bed',
    position: { x: -4.2, y: 0.48, z: -1.8 },
    scale: { x: 1.02, y: 1, z: 1.1 },
    primaryColor: CAMPAIGN_BEDROOM_PALETTE.cream,
    secondaryColor: CAMPAIGN_BEDROOM_PALETTE.lightWood,
  },
  {
    kind: 'rug',
    position: { x: 0, y: 0, z: 1.4 },
    scale: { x: 0.9, y: 1, z: 0.9 },
    primaryColor: CAMPAIGN_BEDROOM_PALETTE.blush,
    secondaryColor: CAMPAIGN_BEDROOM_PALETTE.cream,
  },
  {
    kind: 'lamp',
    position: { x: 4.25, y: 1.31, z: -2.8 },
    scale: { x: 0.72, y: 0.72, z: 0.72 },
    primaryColor: CAMPAIGN_BEDROOM_PALETTE.gold,
    secondaryColor: CAMPAIGN_BEDROOM_PALETTE.darkWood,
  },
  {
    kind: 'chair',
    position: { x: 3.2, y: 0, z: -1.45 },
    rotationY: Math.PI,
    primaryColor: CAMPAIGN_BEDROOM_PALETTE.dustyPink,
    secondaryColor: CAMPAIGN_BEDROOM_PALETTE.darkWood,
  },
  {
    kind: 'plant',
    position: { x: 6.6, y: 0, z: -4.8 },
    scale: { x: 1.15, y: 1.15, z: 1.15 },
    primaryColor: CAMPAIGN_BEDROOM_PALETTE.sage,
    secondaryColor: CAMPAIGN_BEDROOM_PALETTE.lightWood,
  },
  {
    kind: 'wall-art',
    position: { x: 0.4, y: 0.95, z: -5.88 },
    primaryColor: CAMPAIGN_BEDROOM_PALETTE.blush,
    secondaryColor: CAMPAIGN_BEDROOM_PALETTE.darkWood,
  },
  {
    kind: 'shelf',
    position: { x: -0.9, y: 0.82, z: -5.74 },
    primaryColor: CAMPAIGN_BEDROOM_PALETTE.lightWood,
    secondaryColor: CAMPAIGN_BEDROOM_PALETTE.cream,
  },
] as const satisfies readonly StageDecorationDefinition[];

export const CAMPAIGN_PARK_PALETTE = {
  floor: 0xd7dfc5,
  floorLine: 0xc4cfb3,
  wall: 0x86a28b,
  wallTrim: 0x607a66,
  sage: 0x6f8e69,
  deepGreen: 0x4f7158,
  skyBlue: 0x83aab8,
  sand: 0xd7c39d,
  stone: 0x9c9a8e,
  lightStone: 0xb8b5a5,
  wood: 0x8e684d,
  blossom: 0xd99b9b,
  plinth: 0x66715d,
} as const;

export const CAMPAIGN_PARK_VISUAL_STYLE = {
  plinthColor: CAMPAIGN_PARK_PALETTE.plinth,
  floorLineColor: CAMPAIGN_PARK_PALETTE.floorLine,
  wallTrimColor: CAMPAIGN_PARK_PALETTE.wallTrim,
} as const satisfies StageVisualStyleDefinition;

export const CAMPAIGN_PARK_DECORATIONS = [
  {
    kind: 'rug',
    position: { x: 0, y: 0, z: 1.5 },
    scale: { x: 1.5, y: 1, z: 0.62 },
    primaryColor: CAMPAIGN_PARK_PALETTE.sand,
    secondaryColor: CAMPAIGN_PARK_PALETTE.lightStone,
  },
  {
    kind: 'rug',
    position: { x: 2.6, y: 0, z: -3.3 },
    rotationY: -0.34,
    scale: { x: 1.35, y: 1, z: 0.5 },
    primaryColor: CAMPAIGN_PARK_PALETTE.sand,
    secondaryColor: CAMPAIGN_PARK_PALETTE.lightStone,
  },
  {
    kind: 'tree',
    position: { x: -8.2, y: 0, z: -6.4 },
    primaryColor: CAMPAIGN_PARK_PALETTE.deepGreen,
    secondaryColor: CAMPAIGN_PARK_PALETTE.wood,
  },
  {
    kind: 'tree',
    position: { x: 8.1, y: 0, z: -6.2 },
    scale: { x: 0.92, y: 0.92, z: 0.92 },
    primaryColor: CAMPAIGN_PARK_PALETTE.sage,
    secondaryColor: CAMPAIGN_PARK_PALETTE.wood,
  },
  {
    kind: 'tree',
    position: { x: -8.5, y: 0, z: 6.4 },
    scale: { x: 0.82, y: 0.82, z: 0.82 },
    primaryColor: CAMPAIGN_PARK_PALETTE.sage,
    secondaryColor: CAMPAIGN_PARK_PALETTE.wood,
  },
  {
    kind: 'bench',
    position: { x: 7.4, y: 0, z: 1.25 },
    rotationY: -Math.PI / 2,
    primaryColor: CAMPAIGN_PARK_PALETTE.wood,
    secondaryColor: CAMPAIGN_PARK_PALETTE.deepGreen,
  },
  {
    kind: 'flower-cluster',
    position: { x: -6.8, y: 0, z: 5.6 },
    scale: { x: 1.2, y: 1.2, z: 1.2 },
    primaryColor: CAMPAIGN_PARK_PALETTE.blossom,
    secondaryColor: CAMPAIGN_PARK_PALETTE.deepGreen,
  },
  {
    kind: 'flower-cluster',
    position: { x: 7.7, y: 0, z: -5.2 },
    primaryColor: 0xe4c27b,
    secondaryColor: CAMPAIGN_PARK_PALETTE.deepGreen,
  },
  {
    kind: 'rock',
    position: { x: -7.4, y: 0, z: -3.2 },
    scale: { x: 0.85, y: 0.85, z: 0.85 },
    primaryColor: CAMPAIGN_PARK_PALETTE.stone,
    secondaryColor: CAMPAIGN_PARK_PALETTE.lightStone,
  },
] as const satisfies readonly StageDecorationDefinition[];

export const CAMPAIGN_PREP_PALETTE = {
  floor: 0xe9dec9,
  floorLine: 0xd7c8ae,
  wall: 0x8399a2,
  wallTrim: 0x60757d,
  cream: 0xf0e5d1,
  dustyBlue: 0x718f9c,
  darkBlue: 0x58717d,
  warmWood: 0x996c50,
  darkWood: 0x6d4e42,
  terracotta: 0xb86f58,
  sage: 0x71836b,
  plinth: 0x69574c,
} as const;

export const CAMPAIGN_PREP_VISUAL_STYLE = {
  plinthColor: CAMPAIGN_PREP_PALETTE.plinth,
  floorLineColor: CAMPAIGN_PREP_PALETTE.floorLine,
  wallTrimColor: CAMPAIGN_PREP_PALETTE.wallTrim,
} as const satisfies StageVisualStyleDefinition;

export const CAMPAIGN_PREP_DECORATIONS = [
  {
    kind: 'rug',
    position: { x: -3.8, y: 0, z: 0.4 },
    scale: { x: 1.05, y: 1, z: 0.75 },
    primaryColor: CAMPAIGN_PREP_PALETTE.dustyBlue,
    secondaryColor: CAMPAIGN_PREP_PALETTE.cream,
  },
  {
    kind: 'rug',
    position: { x: 3.8, y: 0, z: 0.4 },
    scale: { x: 1.05, y: 1, z: 0.75 },
    primaryColor: CAMPAIGN_PREP_PALETTE.terracotta,
    secondaryColor: CAMPAIGN_PREP_PALETTE.cream,
  },
  {
    kind: 'shelf',
    position: { x: -5.25, y: 0.84, z: -6.72 },
    primaryColor: CAMPAIGN_PREP_PALETTE.darkWood,
    secondaryColor: CAMPAIGN_PREP_PALETTE.cream,
  },
  {
    kind: 'shelf',
    position: { x: 5.25, y: 0.84, z: -6.72 },
    primaryColor: CAMPAIGN_PREP_PALETTE.warmWood,
    secondaryColor: CAMPAIGN_PREP_PALETTE.terracotta,
  },
  {
    kind: 'wall-art',
    position: { x: -1.05, y: 0.95, z: -6.88 },
    primaryColor: CAMPAIGN_PREP_PALETTE.dustyBlue,
    secondaryColor: CAMPAIGN_PREP_PALETTE.darkWood,
  },
  {
    kind: 'wall-art',
    position: { x: 0.4, y: 0.95, z: -6.88 },
    primaryColor: CAMPAIGN_PREP_PALETTE.terracotta,
    secondaryColor: CAMPAIGN_PREP_PALETTE.darkWood,
  },
  {
    kind: 'plant',
    position: { x: 7.5, y: 0, z: 5.4 },
    primaryColor: CAMPAIGN_PREP_PALETTE.sage,
    secondaryColor: CAMPAIGN_PREP_PALETTE.terracotta,
  },
] as const satisfies readonly StageDecorationDefinition[];

export const CAMPAIGN_VIEWPOINT_PALETTE = {
  floor: 0xd9d2ca,
  floorLine: 0xc3b9ae,
  wall: 0x77758f,
  wallTrim: 0x59576c,
  warmStone: 0xa79785,
  lightStone: 0xc1b6a8,
  dustyBlue: 0x71869d,
  mutedPurple: 0x81738f,
  amber: 0xd0a25d,
  darkWood: 0x665044,
  sage: 0x71806c,
  plinth: 0x554f57,
} as const;

export const CAMPAIGN_VIEWPOINT_VISUAL_STYLE = {
  plinthColor: CAMPAIGN_VIEWPOINT_PALETTE.plinth,
  floorLineColor: CAMPAIGN_VIEWPOINT_PALETTE.floorLine,
  wallTrimColor: CAMPAIGN_VIEWPOINT_PALETTE.wallTrim,
} as const satisfies StageVisualStyleDefinition;

export const CAMPAIGN_VIEWPOINT_DECORATIONS = [
  {
    kind: 'rug',
    position: { x: 0, y: 0, z: -2.5 },
    scale: { x: 1.65, y: 1, z: 0.9 },
    primaryColor: CAMPAIGN_VIEWPOINT_PALETTE.warmStone,
    secondaryColor: CAMPAIGN_VIEWPOINT_PALETTE.amber,
  },
  {
    kind: 'railing',
    position: { x: -5.7, y: 0, z: -6.55 },
    primaryColor: CAMPAIGN_VIEWPOINT_PALETTE.amber,
    secondaryColor: CAMPAIGN_VIEWPOINT_PALETTE.darkWood,
  },
  {
    kind: 'railing',
    position: { x: -2.1, y: 0, z: -6.55 },
    primaryColor: CAMPAIGN_VIEWPOINT_PALETTE.amber,
    secondaryColor: CAMPAIGN_VIEWPOINT_PALETTE.darkWood,
  },
  {
    kind: 'railing',
    position: { x: 5.6, y: 0, z: -6.55 },
    primaryColor: CAMPAIGN_VIEWPOINT_PALETTE.amber,
    secondaryColor: CAMPAIGN_VIEWPOINT_PALETTE.darkWood,
  },
  {
    kind: 'rock',
    position: { x: -7.25, y: 0, z: 4.6 },
    primaryColor: CAMPAIGN_VIEWPOINT_PALETTE.warmStone,
    secondaryColor: CAMPAIGN_VIEWPOINT_PALETTE.lightStone,
  },
  {
    kind: 'rock',
    position: { x: 7.2, y: 0, z: -4.75 },
    scale: { x: 0.82, y: 0.82, z: 0.82 },
    primaryColor: CAMPAIGN_VIEWPOINT_PALETTE.mutedPurple,
    secondaryColor: CAMPAIGN_VIEWPOINT_PALETTE.warmStone,
  },
  {
    kind: 'lamp',
    position: { x: 5.45, y: 0, z: -1.8 },
    scale: { x: 1.2, y: 1.2, z: 1.2 },
    primaryColor: CAMPAIGN_VIEWPOINT_PALETTE.amber,
    secondaryColor: CAMPAIGN_VIEWPOINT_PALETTE.darkWood,
  },
  {
    kind: 'plant',
    position: { x: -7.45, y: 0, z: -4.5 },
    primaryColor: CAMPAIGN_VIEWPOINT_PALETTE.sage,
    secondaryColor: CAMPAIGN_VIEWPOINT_PALETTE.warmStone,
  },
] as const satisfies readonly StageDecorationDefinition[];

export const CAMPAIGN_ENDING_PALETTE = {
  floor: 0xeadbcf,
  floorLine: 0xd8c4b6,
  wall: 0xb77e83,
  wallTrim: 0x875b62,
  cream: 0xf4e8d7,
  rose: 0xc96f73,
  blush: 0xdda5a0,
  gold: 0xd5ad60,
  darkWood: 0x755047,
  sage: 0x76846d,
  dustyBlue: 0x748d9a,
  plinth: 0x6c4f4c,
} as const;

export const CAMPAIGN_ENDING_VISUAL_STYLE = {
  plinthColor: CAMPAIGN_ENDING_PALETTE.plinth,
  floorLineColor: CAMPAIGN_ENDING_PALETTE.floorLine,
  wallTrimColor: CAMPAIGN_ENDING_PALETTE.wallTrim,
} as const satisfies StageVisualStyleDefinition;

export const CAMPAIGN_ENDING_DECORATIONS = [
  {
    kind: 'rug',
    position: { x: 0, y: 0, z: 0.7 },
    scale: { x: 1.2, y: 1, z: 1.05 },
    primaryColor: CAMPAIGN_ENDING_PALETTE.blush,
    secondaryColor: CAMPAIGN_ENDING_PALETTE.gold,
  },
  {
    kind: 'table-setting',
    position: { x: -1.35, y: 1.315, z: -2.6 },
    primaryColor: CAMPAIGN_ENDING_PALETTE.cream,
    secondaryColor: CAMPAIGN_ENDING_PALETTE.rose,
  },
  {
    kind: 'table-setting',
    position: { x: 1.35, y: 1.315, z: -2.6 },
    rotationY: Math.PI,
    primaryColor: CAMPAIGN_ENDING_PALETTE.cream,
    secondaryColor: CAMPAIGN_ENDING_PALETTE.dustyBlue,
  },
  {
    kind: 'gift',
    position: { x: -4.7, y: 1.5, z: -1.2 },
    scale: { x: 0.9, y: 0.9, z: 0.9 },
    primaryColor: CAMPAIGN_ENDING_PALETTE.rose,
    secondaryColor: CAMPAIGN_ENDING_PALETTE.gold,
  },
  {
    kind: 'gift',
    position: { x: 4.7, y: 1.5, z: -1.2 },
    scale: { x: 0.82, y: 0.82, z: 0.82 },
    primaryColor: CAMPAIGN_ENDING_PALETTE.dustyBlue,
    secondaryColor: CAMPAIGN_ENDING_PALETTE.gold,
  },
  {
    kind: 'lamp',
    position: { x: -2.1, y: 1.31, z: -2.6 },
    scale: { x: 0.72, y: 0.72, z: 0.72 },
    primaryColor: CAMPAIGN_ENDING_PALETTE.gold,
    secondaryColor: CAMPAIGN_ENDING_PALETTE.darkWood,
  },
  {
    kind: 'lamp',
    position: { x: 2.1, y: 1.31, z: -2.6 },
    scale: { x: 0.72, y: 0.72, z: 0.72 },
    primaryColor: CAMPAIGN_ENDING_PALETTE.gold,
    secondaryColor: CAMPAIGN_ENDING_PALETTE.darkWood,
  },
  {
    kind: 'wall-art',
    position: { x: -1.2, y: 0.95, z: -5.88 },
    primaryColor: CAMPAIGN_ENDING_PALETTE.blush,
    secondaryColor: CAMPAIGN_ENDING_PALETTE.gold,
  },
  {
    kind: 'wall-art',
    position: { x: 0.2, y: 0.95, z: -5.88 },
    primaryColor: CAMPAIGN_ENDING_PALETTE.dustyBlue,
    secondaryColor: CAMPAIGN_ENDING_PALETTE.gold,
  },
  {
    kind: 'flower-cluster',
    position: { x: 0, y: 1.315, z: -2.6 },
    scale: { x: 0.8, y: 0.8, z: 0.8 },
    primaryColor: CAMPAIGN_ENDING_PALETTE.rose,
    secondaryColor: CAMPAIGN_ENDING_PALETTE.sage,
  },
] as const satisfies readonly StageDecorationDefinition[];
