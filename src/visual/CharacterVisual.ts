import {
  BoxGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
} from 'three';
import { CharacterAnimator, type CharacterRig } from './CharacterAnimator';
import { ContactShadow } from './ContactShadow';

export type CharacterSilhouette = 'scarf' | 'hair-bun';

export interface CharacterVisualStyle {
  readonly bodyColor: number;
  readonly secondaryColor: number;
  readonly skinColor: number;
  readonly hairColor: number;
  readonly silhouette: CharacterSilhouette;
}

export interface CharacterVisualModel {
  readonly root: Group;
  readonly carryAnchor: Group;
  readonly speechAnchor: Group;
  readonly animator: CharacterAnimator;
}

function material(color: number, roughness = 0.82): MeshStandardMaterial {
  return new MeshStandardMaterial({ color, roughness, metalness: 0 });
}

function shadowed(mesh: Mesh): Mesh {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createCharacterVisual(
  name: string,
  style: CharacterVisualStyle,
): CharacterVisualModel {
  const root = new Group();
  root.name = name;

  const contactShadow = new ContactShadow(0.47, 0.22);
  contactShadow.mesh.position.y = -0.885;
  root.add(contactShadow.mesh);

  const visualRoot = new Group();
  visualRoot.name = 'CharacterVisual';
  root.add(visualRoot);

  const body = new Group();
  body.name = 'BodyRig';
  visualRoot.add(body);

  const torso = shadowed(new Mesh(
    new CapsuleGeometry(0.34, 0.34, 6, 14),
    material(style.bodyColor, 0.86),
  ));
  torso.scale.set(1.02, 1.05, 0.88);
  torso.position.y = -0.06;
  body.add(torso);

  const collar = shadowed(new Mesh(
    new CylinderGeometry(0.29, 0.32, 0.12, 14),
    material(style.secondaryColor, 0.78),
  ));
  collar.position.y = 0.3;
  body.add(collar);

  const head = new Group();
  head.name = 'HeadRig';
  head.position.y = 0.54;
  visualRoot.add(head);

  const hairBack = shadowed(new Mesh(
    new SphereGeometry(0.365, 18, 12),
    material(style.hairColor, 0.92),
  ));
  hairBack.position.set(0, 0.035, -0.055);
  hairBack.scale.set(1.03, 1.02, 0.92);
  head.add(hairBack);

  const face = shadowed(new Mesh(
    new SphereGeometry(0.34, 20, 14),
    material(style.skinColor, 0.9),
  ));
  face.position.z = 0.035;
  face.scale.set(0.98, 0.98, 0.94);
  head.add(face);

  const fringe = shadowed(new Mesh(
    new SphereGeometry(0.345, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.42),
    material(style.hairColor, 0.92),
  ));
  fringe.rotation.x = 0.12;
  fringe.position.set(0, 0.12, 0.02);
  head.add(fringe);

  const eyeMaterial = material(0x3c2f2b, 0.72);
  for (const side of [-1, 1]) {
    const eye = shadowed(new Mesh(new SphereGeometry(0.036, 8, 6), eyeMaterial));
    eye.position.set(side * 0.108, 0.015, 0.335);
    eye.scale.set(0.78, 1.15, 0.72);
    head.add(eye);
  }

  const cheekMaterial = material(0xd98b7d, 0.9);
  for (const side of [-1, 1]) {
    const cheek = shadowed(new Mesh(new SphereGeometry(0.028, 8, 6), cheekMaterial));
    cheek.position.set(side * 0.19, -0.075, 0.31);
    cheek.scale.set(1.45, 0.62, 0.45);
    head.add(cheek);
  }

  const armGeometry = new CapsuleGeometry(0.105, 0.26, 5, 10);
  const armMaterial = material(style.bodyColor, 0.86);
  const handMaterial = material(style.skinColor, 0.9);
  const arms: Group[] = [];
  for (const side of [-1, 1]) {
    const arm = new Group();
    arm.name = side < 0 ? 'LeftArmRig' : 'RightArmRig';
    arm.position.set(side * 0.38, 0.18, 0);
    const sleeve = shadowed(new Mesh(armGeometry, armMaterial));
    sleeve.position.y = -0.2;
    sleeve.scale.set(0.94, 1, 0.94);
    const hand = shadowed(new Mesh(new SphereGeometry(0.105, 10, 8), handMaterial));
    hand.position.y = -0.43;
    arm.add(sleeve, hand);
    visualRoot.add(arm);
    arms.push(arm);
  }

  const legGeometry = new CapsuleGeometry(0.115, 0.24, 5, 10);
  const legMaterial = material(style.secondaryColor, 0.88);
  const shoeMaterial = material(0x5b4037, 0.9);
  const legs: Group[] = [];
  for (const side of [-1, 1]) {
    const leg = new Group();
    leg.name = side < 0 ? 'LeftLegRig' : 'RightLegRig';
    leg.position.set(side * 0.17, -0.4, 0);
    const limb = shadowed(new Mesh(legGeometry, legMaterial));
    limb.position.y = -0.2;
    const shoe = shadowed(new Mesh(new CapsuleGeometry(0.12, 0.11, 4, 9), shoeMaterial));
    shoe.rotation.x = Math.PI / 2;
    shoe.position.set(0, -0.42, 0.055);
    shoe.scale.set(1, 1, 0.82);
    leg.add(limb, shoe);
    visualRoot.add(leg);
    legs.push(leg);
  }

  if (style.silhouette === 'hair-bun') {
    const bun = shadowed(new Mesh(
      new SphereGeometry(0.19, 14, 10),
      material(style.hairColor, 0.92),
    ));
    bun.position.set(0, 0.19, -0.31);
    head.add(bun);
  } else {
    const scarf = shadowed(new Mesh(
      new BoxGeometry(0.16, 0.34, 0.08),
      material(style.secondaryColor, 0.8),
    ));
    scarf.position.set(0.26, 0.08, 0.31);
    scarf.rotation.z = -0.22;
    body.add(scarf);
  }

  const carryAnchor = new Group();
  carryAnchor.name = 'CarryAnchor';
  carryAnchor.position.set(0, 0.08, 0.73);
  visualRoot.add(carryAnchor);

  const speechAnchor = new Group();
  speechAnchor.name = 'SpeechAnchor';
  speechAnchor.position.y = 1.08;
  root.add(speechAnchor);

  const [leftArm, rightArm] = arms;
  const [leftLeg, rightLeg] = legs;
  if (leftArm === undefined || rightArm === undefined || leftLeg === undefined || rightLeg === undefined) {
    throw new Error('Character rig creation failed.');
  }
  const rig: CharacterRig = {
    visualRoot,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    contactShadow,
  };
  const animator = new CharacterAnimator(rig);
  animator.reset();

  return { root, carryAnchor, speechAnchor, animator };
}
