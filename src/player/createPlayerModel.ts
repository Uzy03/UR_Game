import type { Group } from 'three';
import type { CharacterAnimator } from '../visual/CharacterAnimator';
import {
  createCharacterVisual,
  type CharacterVisualStyle,
} from '../visual/CharacterVisual';

const PLAYER_STYLE: CharacterVisualStyle = {
  bodyColor: 0xc96f61,
  secondaryColor: 0x486b73,
  skinColor: 0xf2c6a5,
  hairColor: 0x5a3e35,
  silhouette: 'scarf',
};

export interface PlayerModel {
  readonly root: Group;
  readonly carryAnchor: Group;
  readonly animator: CharacterAnimator;
}

export function createPlayerModel(): PlayerModel {
  const model = createCharacterVisual('Player', PLAYER_STYLE);
  return {
    root: model.root,
    carryAnchor: model.carryAnchor,
    animator: model.animator,
  };
}
