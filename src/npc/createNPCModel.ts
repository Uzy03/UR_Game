import {
  Group,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
} from 'three';
import type { CharacterAnimator } from '../visual/CharacterAnimator';
import {
  createCharacterVisual,
  type CharacterVisualStyle,
} from '../visual/CharacterVisual';

const COMPANION_STYLE: CharacterVisualStyle = {
  bodyColor: 0x76929a,
  secondaryColor: 0xd19a70,
  skinColor: 0xf0c3a0,
  hairColor: 0x4d3836,
  silhouette: 'hair-bun',
};

export interface NPCModel {
  readonly root: Group;
  readonly highlight: Mesh;
  readonly speechAnchor: Group;
  readonly animator: CharacterAnimator;
}

export function createNPCModel(): NPCModel {
  const character = createCharacterVisual('NPC', COMPANION_STYLE);
  const highlight = new Mesh(
    new RingGeometry(0.46, 0.57, 32),
    new MeshBasicMaterial({
      color: 0xf3d58a,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  highlight.name = 'NPCInteractionHighlight';
  highlight.rotation.x = -Math.PI / 2;
  highlight.position.y = -0.875;
  highlight.visible = false;
  character.root.add(highlight);

  return {
    root: character.root,
    highlight,
    speechAnchor: character.speechAnchor,
    animator: character.animator,
  };
}
