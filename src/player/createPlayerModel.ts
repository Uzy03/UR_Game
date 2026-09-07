import {
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
} from 'three';

const BODY_MATERIAL = new MeshStandardMaterial({ color: 0xf17675, roughness: 0.72 });
const SKIN_MATERIAL = new MeshStandardMaterial({ color: 0xffd1ae, roughness: 0.8 });
const LEG_MATERIAL = new MeshStandardMaterial({ color: 0x496b83, roughness: 0.8 });
const EYE_MATERIAL = new MeshStandardMaterial({ color: 0x263b47, roughness: 0.6 });

export interface PlayerModel {
  readonly root: Group;
  readonly carryAnchor: Group;
}

export function createPlayerModel(): PlayerModel {
  const model = new Group();
  model.name = 'Player';

  const carryAnchor = new Group();
  carryAnchor.name = 'CarryAnchor';
  carryAnchor.position.set(0, 0.12, 0.7);
  model.add(carryAnchor);

  const torso = new Mesh(new CylinderGeometry(0.34, 0.43, 0.82, 16), BODY_MATERIAL);
  torso.position.y = -0.08;
  model.add(torso);

  const head = new Mesh(new SphereGeometry(0.32, 18, 14), SKIN_MATERIAL);
  head.position.y = 0.52;
  model.add(head);

  const armGeometry = new SphereGeometry(0.14, 12, 10);
  for (const side of [-1, 1]) {
    const arm = new Mesh(armGeometry, SKIN_MATERIAL);
    arm.scale.set(0.72, 1.45, 0.72);
    arm.position.set(side * 0.4, -0.08, 0);
    model.add(arm);
  }

  const legGeometry = new CylinderGeometry(0.12, 0.14, 0.44, 12);
  for (const side of [-1, 1]) {
    const leg = new Mesh(legGeometry, LEG_MATERIAL);
    leg.position.set(side * 0.17, -0.61, 0);
    model.add(leg);
  }

  const eyeGeometry = new SphereGeometry(0.035, 8, 6);
  for (const side of [-1, 1]) {
    const eye = new Mesh(eyeGeometry, EYE_MATERIAL);
    eye.position.set(side * 0.105, 0.57, 0.295);
    model.add(eye);
  }

  model.traverse((object) => {
    if (object instanceof Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  return { root: model, carryAnchor };
}
