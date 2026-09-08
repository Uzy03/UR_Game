import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
} from 'three';
import type {
  StageDecorationDefinition,
  StageDecorationKind,
  Vector3Config,
} from './StageTypes';

interface DecorationShadowPolicy {
  readonly casterChildIndices: readonly number[];
  readonly receiveShadow: boolean;
}

const DECORATION_SHADOW_POLICY: Record<StageDecorationKind, DecorationShadowPolicy> = {
  bed: { casterChildIndices: [1, 2], receiveShadow: true },
  bench: { casterChildIndices: [0, 1], receiveShadow: true },
  chair: { casterChildIndices: [0, 1], receiveShadow: true },
  'flower-cluster': { casterChildIndices: [], receiveShadow: false },
  gift: { casterChildIndices: [0, 1], receiveShadow: true },
  lamp: { casterChildIndices: [], receiveShadow: false },
  railing: { casterChildIndices: [], receiveShadow: false },
  rock: { casterChildIndices: [1], receiveShadow: true },
  rug: { casterChildIndices: [], receiveShadow: true },
  plant: { casterChildIndices: [1, 2], receiveShadow: false },
  tree: { casterChildIndices: [1, 2], receiveShadow: false },
  'wall-art': { casterChildIndices: [], receiveShadow: false },
  shelf: { casterChildIndices: [], receiveShadow: false },
  'table-setting': { casterChildIndices: [], receiveShadow: false },
  pendant: { casterChildIndices: [], receiveShadow: false },
};

interface MaterialOptions {
  readonly emissive?: number;
  readonly emissiveIntensity?: number;
  readonly roughness?: number;
}

function createMaterial(color: number, options: MaterialOptions = {}): MeshStandardMaterial {
  const emissive = options.emissive ?? 0;
  return new MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: emissive === 0 ? 0 : (options.emissiveIntensity ?? 0.65),
    roughness: options.roughness ?? 0.82,
    metalness: 0,
  });
}

function createBox(
  size: Vector3Config,
  position: Vector3Config,
  color: number,
): Mesh {
  const mesh = new Mesh(
    new BoxGeometry(size.x, size.y, size.z),
    createMaterial(color),
  );
  mesh.position.set(position.x, position.y, position.z);
  return mesh;
}

function createCylinder(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  color: number,
  position: Vector3Config,
  radialSegments = 12,
  roughness = 0.82,
  openEnded = false,
): Mesh {
  const mesh = new Mesh(
    new CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, 1, openEnded),
    createMaterial(color, { roughness }),
  );
  mesh.position.set(position.x, position.y, position.z);
  return mesh;
}

function addChair(group: Group, primary: number, secondary: number): void {
  const seatHeight = 0.46;
  group.add(
    createBox({ x: 0.68, y: 0.12, z: 0.64 }, { x: 0, y: seatHeight, z: 0 }, primary),
    createBox({ x: 0.68, y: 0.62, z: 0.1 }, { x: 0, y: 0.75, z: -0.27 }, primary),
  );
  for (const x of [-0.25, 0.25]) {
    for (const z of [-0.22, 0.22]) {
      group.add(createBox(
        { x: 0.09, y: 0.45, z: 0.09 },
        { x, y: 0.225, z },
        secondary,
      ));
    }
  }
}

function addBed(group: Group, primary: number, secondary: number): void {
  group.add(
    createBox({ x: 2.55, y: 0.2, z: 3.45 }, { x: 0, y: 0.13, z: 0 }, secondary),
    createBox({ x: 2.35, y: 0.3, z: 3.15 }, { x: 0, y: 0.37, z: 0.05 }, primary),
    createBox({ x: 2.55, y: 0.9, z: 0.16 }, { x: 0, y: 0.55, z: -1.65 }, secondary),
    createBox({ x: 1.25, y: 0.16, z: 0.62 }, { x: 0, y: 0.61, z: -1.1 }, 0xf7eee1),
  );
}

function addBench(group: Group, primary: number, secondary: number): void {
  group.add(
    createBox({ x: 2.5, y: 0.16, z: 0.62 }, { x: 0, y: 0.52, z: 0 }, primary),
    createBox({ x: 2.5, y: 0.62, z: 0.14 }, { x: 0, y: 0.86, z: -0.25 }, primary),
  );
  for (const x of [-0.92, 0.92]) {
    group.add(createBox(
      { x: 0.14, y: 0.52, z: 0.48 },
      { x, y: 0.26, z: 0 },
      secondary,
    ));
  }
}

function addPlant(group: Group, primary: number, secondary: number): void {
  group.add(createCylinder(
    0.25,
    0.19,
    0.38,
    secondary,
    { x: 0, y: 0.19, z: 0 },
    10,
    0.9,
  ));
  for (const [x, y, z, scale] of [
    [-0.11, 0.52, 0, 0.28],
    [0.12, 0.57, 0.03, 0.3],
    [0, 0.7, -0.04, 0.27],
  ] as const) {
    const leaf = new Mesh(
      new IcosahedronGeometry(scale, 1),
      createMaterial(primary, { roughness: 0.94 }),
    );
    leaf.position.set(x, y, z);
    group.add(leaf);
  }
}

function addTree(group: Group, primary: number, secondary: number): void {
  group.add(createCylinder(0.2, 0.28, 1.8, secondary, { x: 0, y: 0.9, z: 0 }, 10));
  for (const [x, y, z, scale] of [
    [0, 2.05, 0, 0.82],
    [-0.52, 1.86, 0.04, 0.62],
    [0.48, 1.88, -0.04, 0.66],
    [0.05, 2.52, -0.08, 0.58],
  ] as const) {
    const crown = new Mesh(
      new IcosahedronGeometry(scale, 1),
      createMaterial(primary),
    );
    crown.position.set(x, y, z);
    group.add(crown);
  }
}

function addFlowerCluster(group: Group, primary: number, secondary: number): void {
  for (const [x, z, height] of [
    [-0.3, -0.08, 0.44],
    [-0.12, 0.18, 0.55],
    [0.08, -0.12, 0.5],
    [0.3, 0.12, 0.42],
  ] as const) {
    group.add(createCylinder(0.025, 0.03, height, secondary, {
      x,
      y: height / 2,
      z,
    }, 8));
    const blossom = new Mesh(
      new SphereGeometry(0.13, 10, 7),
      createMaterial(primary),
    );
    blossom.position.set(x, height, z);
    group.add(blossom);
  }
}

function addRock(group: Group, primary: number, secondary: number): void {
  for (const [x, y, z, scale, color] of [
    [-0.38, 0.28, 0.04, 0.55, primary],
    [0.22, 0.36, -0.08, 0.68, secondary],
    [0.62, 0.2, 0.12, 0.38, primary],
  ] as const) {
    const rock = new Mesh(
      new IcosahedronGeometry(scale, 1),
      createMaterial(color),
    );
    rock.position.set(x, y, z);
    rock.scale.y = 0.68;
    group.add(rock);
  }
}

function addLamp(group: Group, primary: number, secondary: number): void {
  group.add(
    createCylinder(0.2, 0.25, 0.1, secondary, { x: 0, y: 0.05, z: 0 }, 12),
    createCylinder(0.035, 0.045, 0.64, secondary, { x: 0, y: 0.39, z: 0 }, 10),
    createCylinder(0.19, 0.34, 0.28, primary, { x: 0, y: 0.75, z: 0 }, 16),
  );
  const glow = new Mesh(
    new SphereGeometry(0.1, 12, 8),
    createMaterial(0xffe3ad, { emissive: 0x80551f }),
  );
  glow.position.y = 0.68;
  group.add(glow);
}

function addRailing(group: Group, primary: number, secondary: number): void {
  for (const x of [-1.45, 0, 1.45]) {
    group.add(createBox(
      { x: 0.13, y: 0.9, z: 0.13 },
      { x, y: 0.45, z: 0 },
      secondary,
    ));
  }
  group.add(
    createBox({ x: 3, y: 0.14, z: 0.14 }, { x: 0, y: 0.82, z: 0 }, primary),
    createBox({ x: 3, y: 0.09, z: 0.09 }, { x: 0, y: 0.43, z: 0 }, primary),
  );
}

function addGift(group: Group, primary: number, secondary: number): void {
  group.add(
    createBox({ x: 0.8, y: 0.58, z: 0.72 }, { x: 0, y: 0.29, z: 0 }, primary),
    createBox({ x: 0.88, y: 0.12, z: 0.8 }, { x: 0, y: 0.63, z: 0 }, primary),
    createBox({ x: 0.13, y: 0.7, z: 0.76 }, { x: 0, y: 0.35, z: 0 }, secondary),
    createBox({ x: 0.84, y: 0.7, z: 0.13 }, { x: 0, y: 0.35, z: 0 }, secondary),
  );
  for (const x of [-0.14, 0.14]) {
    const bow = new Mesh(new SphereGeometry(0.14, 10, 7), createMaterial(secondary));
    bow.position.set(x, 0.78, 0);
    bow.scale.set(1.25, 0.65, 0.8);
    group.add(bow);
  }
}

export function createStageDecoration(definition: StageDecorationDefinition): Group {
  const group = new Group();
  group.name = `StageDecoration:${definition.kind}`;
  group.position.set(definition.position.x, definition.position.y, definition.position.z);
  group.rotation.y = definition.rotationY ?? 0;
  if (definition.scale !== undefined) {
    group.scale.set(definition.scale.x, definition.scale.y, definition.scale.z);
  }

  const secondary = definition.secondaryColor ?? new Color(definition.primaryColor)
    .offsetHSL(0, 0, -0.12)
    .getHex();

  switch (definition.kind) {
    case 'bed':
      addBed(group, definition.primaryColor, secondary);
      break;
    case 'bench':
      addBench(group, definition.primaryColor, secondary);
      break;
    case 'chair':
      addChair(group, definition.primaryColor, secondary);
      break;
    case 'flower-cluster':
      addFlowerCluster(group, definition.primaryColor, secondary);
      break;
    case 'gift':
      addGift(group, definition.primaryColor, secondary);
      break;
    case 'lamp':
      addLamp(group, definition.primaryColor, secondary);
      break;
    case 'plant':
      addPlant(group, definition.primaryColor, secondary);
      break;
    case 'railing':
      addRailing(group, definition.primaryColor, secondary);
      break;
    case 'rock':
      addRock(group, definition.primaryColor, secondary);
      break;
    case 'rug':
      group.add(
        createBox({ x: 3.8, y: 0.035, z: 2.5 }, { x: 0, y: 0.018, z: 0 }, definition.primaryColor),
        createBox({ x: 3.25, y: 0.012, z: 0.08 }, { x: 0, y: 0.043, z: 0 }, secondary),
      );
      break;
    case 'shelf':
      group.add(createBox(
        { x: 2.2, y: 0.12, z: 0.42 },
        { x: 0, y: 0, z: 0 },
        definition.primaryColor,
      ));
      for (const x of [-0.72, 0, 0.72]) {
        group.add(createCylinder(
          0.14,
          0.16,
          0.34,
          secondary,
          { x, y: 0.23, z: 0 },
          10,
          0.8,
        ));
      }
      break;
    case 'table-setting': {
      const plate = createCylinder(
        0.28,
        0.24,
        0.055,
        definition.primaryColor,
        { x: -0.25, y: 0.03, z: 0 },
        20,
        0.72,
      );
      const cup = createCylinder(
        0.1,
        0.085,
        0.22,
        secondary,
        { x: 0.25, y: 0.11, z: 0.02 },
        14,
        0.76,
      );
      group.add(plate, cup);
      break;
    }
    case 'tree':
      addTree(group, definition.primaryColor, secondary);
      break;
    case 'wall-art':
      group.add(
        createBox({ x: 1.15, y: 0.8, z: 0.08 }, { x: 0, y: 0, z: 0 }, secondary),
        createBox({ x: 0.91, y: 0.57, z: 0.035 }, { x: 0, y: 0, z: 0.055 }, definition.primaryColor),
      );
      break;
    case 'pendant': {
      group.add(createBox(
        { x: 0.035, y: 0.8, z: 0.035 },
        { x: 0, y: 0.4, z: 0 },
        secondary,
      ));
      const shade = createCylinder(
        0.18,
        0.42,
        0.3,
        definition.primaryColor,
        { x: 0, y: -0.08, z: 0 },
        16,
        0.72,
        true,
      );
      const bulb = new Mesh(
        new SphereGeometry(0.1, 12, 8),
        createMaterial(0xffe1a6, {
          emissive: 0x6f441a,
          emissiveIntensity: 0.7,
          roughness: 0.5,
        }),
      );
      bulb.position.y = -0.18;
      group.add(shade, bulb);
      break;
    }
    default: {
      const unsupportedKind: never = definition.kind;
      throw new Error(`Unsupported stage decoration kind: ${unsupportedKind}`);
    }
  }

  const shadowPolicy = DECORATION_SHADOW_POLICY[definition.kind];
  const casterIndices = new Set(shadowPolicy.casterChildIndices);
  let meshIndex = 0;
  group.traverse((object) => {
    if (object instanceof Mesh) {
      object.castShadow = casterIndices.has(meshIndex);
      object.receiveShadow = shadowPolicy.receiveShadow;
      meshIndex += 1;
    }
  });
  return group;
}
