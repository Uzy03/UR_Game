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
