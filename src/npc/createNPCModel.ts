import {
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RingGeometry,
  SphereGeometry,
} from 'three';

export interface NPCModel {
  readonly root: Group;
  readonly highlight: Mesh;
  readonly speechAnchor: Group;
}

export function createNPCModel(): NPCModel {
  const root = new Group();
  root.name = 'NPC';

  const bodyMaterial = new MeshStandardMaterial({ color: 0x6f86d6, roughness: 0.72 });
  const skinMaterial = new MeshStandardMaterial({ color: 0xf3bd91, roughness: 0.8 });
  const legMaterial = new MeshStandardMaterial({ color: 0x3f526f, roughness: 0.8 });
  const eyeMaterial = new MeshStandardMaterial({ color: 0x25303a, roughness: 0.6 });

  const torso = new Mesh(new CylinderGeometry(0.36, 0.45, 0.84, 16), bodyMaterial);
  torso.position.y = -0.08;
  root.add(torso);

  const head = new Mesh(new SphereGeometry(0.34, 18, 14), skinMaterial);
  head.position.y = 0.54;
  root.add(head);

  const armGeometry = new SphereGeometry(0.14, 12, 10);
  for (const side of [-1, 1]) {
    const arm = new Mesh(armGeometry, skinMaterial);
    arm.scale.set(0.72, 1.45, 0.72);
    arm.position.set(side * 0.42, -0.08, 0);
    root.add(arm);
  }

  const legGeometry = new CylinderGeometry(0.12, 0.14, 0.44, 12);
  for (const side of [-1, 1]) {
    const leg = new Mesh(legGeometry, legMaterial);
    leg.position.set(side * 0.17, -0.61, 0);
    root.add(leg);
  }

  const eyeGeometry = new SphereGeometry(0.035, 8, 6);
  for (const side of [-1, 1]) {
    const eye = new Mesh(eyeGeometry, eyeMaterial);
    eye.position.set(side * 0.11, 0.6, 0.31);
    root.add(eye);
  }

  const highlight = new Mesh(
    new RingGeometry(0.43, 0.55, 32),
    new MeshBasicMaterial({ color: 0xffef8a, transparent: true, opacity: 0.9, depthWrite: false }),
  );
  highlight.name = 'NPCInteractionHighlight';
  highlight.rotation.x = -Math.PI / 2;
  highlight.position.y = -0.84;
  highlight.visible = false;
  root.add(highlight);

  const speechAnchor = new Group();
  speechAnchor.name = 'NPCSpeechAnchor';
  speechAnchor.position.y = 1.08;
  root.add(speechAnchor);

  root.traverse((object) => {
    if (object instanceof Mesh && object !== highlight) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  return { root, highlight, speechAnchor };
}
