import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  type Object3D,
} from 'three';
import { disposeObject3D } from '../core/disposeObject3D';
import { PickableItem } from '../interaction/PickableItem';
import { PlacePoint } from '../interaction/PlacePoint';
import type { PhysicsBodyHandle, PhysicsWorld } from '../physics/PhysicsWorld';
import type {
  StageDecorationDefinition,
  StageDefinition,
  StageObstacleDefinition,
} from './StageTypes';

const TABLE_LEG_DARKEN = 0.15;

export class Stage {
  public readonly object = new Group();
  public readonly pickableItems: readonly PickableItem[];
  public readonly placePoints: readonly PlacePoint[];
  private readonly physicsHandles: PhysicsBodyHandle[] = [];
  private disposed = false;

  public constructor(
    parent: Object3D,
    physics: PhysicsWorld,
    private readonly options: StageDefinition,
  ) {
    this.object.name = 'Stage';
    parent.add(this.object);

    try {
      this.createFloor(physics, options);
      this.createWalls(physics, options);
      this.createDioramaFinish(options);

      for (const obstacle of options.obstacles) {
        this.createObstacle(physics, obstacle);
      }
      for (const decoration of options.decorations ?? []) {
        this.object.add(this.createDecoration(decoration));
      }

      this.pickableItems = options.items.map((item) => new PickableItem({
        id: item.id,
        kind: item.kind,
        position: item.position,
        parent: this.object,
        initialProcessingState: item.initialProcessingState,
        initialActive: item.initialActive,
      }));
      this.placePoints = options.placePoints.map((placePoint) => new PlacePoint({
        id: placePoint.id,
        position: placePoint.position,
        parent: this.object,
      }));
    } catch (error: unknown) {
      this.pickableItems = [];
      this.placePoints = [];
      this.dispose();
      throw error;
    }
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;

    for (const handle of this.physicsHandles) {
      handle.dispose();
    }
    this.physicsHandles.length = 0;
    this.object.removeFromParent();
    disposeObject3D(this.object);
    this.object.clear();
  }

  public isFloorDropPositionValid(
    position: { readonly x: number; readonly z: number },
    item: PickableItem,
    allItems: readonly PickableItem[],
    spacing: number,
  ): boolean {
    const radius = item.footprintRadius;
    if (
      position.x - radius < -this.options.width / 2
      || position.x + radius > this.options.width / 2
      || position.z - radius < -this.options.depth / 2
      || position.z + radius > this.options.depth / 2
    ) {
      return false;
    }

    for (const obstacle of this.options.obstacles) {
      const overlapsX = Math.abs(position.x - obstacle.position.x) < obstacle.size.x / 2 + radius;
      const overlapsZ = Math.abs(position.z - obstacle.position.z) < obstacle.size.z / 2 + radius;
      if (overlapsX && overlapsZ) {
        return false;
      }
    }

    for (const otherItem of allItems) {
      if (otherItem === item || !otherItem.isOnFloor()) {
        continue;
      }

      const otherPosition = otherItem.object.position;
      const minimumDistance = radius + otherItem.footprintRadius + spacing;
      const distanceSquared = (
        (position.x - otherPosition.x) ** 2
        + (position.z - otherPosition.z) ** 2
      );
      if (distanceSquared < minimumDistance ** 2) {
        return false;
      }
    }

    return true;
  }

  public getPlacePoints(ids: readonly string[]): readonly PlacePoint[] {
    return ids.map((id) => {
      const placePoint = this.placePoints.find((candidate) => candidate.id === id);
      if (placePoint === undefined) {
        throw new Error(`PlacePoint "${id}" was not found in the stage.`);
      }
      return placePoint;
    });
  }

  public getPickableItems(ids: readonly string[]): readonly PickableItem[] {
    return ids.map((id) => {
      const item = this.pickableItems.find((candidate) => candidate.id === id);
      if (item === undefined) {
        throw new Error(`PickableItem "${id}" was not found in the stage.`);
      }
      return item;
    });
  }

  private createFloor(physics: PhysicsWorld, options: StageDefinition): void {
    const size = { x: options.width, y: options.floorThickness, z: options.depth };
    const position = { x: 0, y: -options.floorThickness / 2, z: 0 };
    this.object.add(this.createBoxMesh(size, position, options.floorColor));
    this.physicsHandles.push(physics.createFixedBox({ size, position, friction: 0.9 }));
  }

  private createWalls(physics: PhysicsWorld, options: StageDefinition): void {
    const { width, depth, wallThickness, wallHeight } = options;
    const wallDefinitions = [
      {
        size: { x: width + wallThickness * 2, y: wallHeight, z: wallThickness },
        position: { x: 0, y: wallHeight / 2, z: -depth / 2 - wallThickness / 2 },
      },
      {
        size: { x: width + wallThickness * 2, y: wallHeight, z: wallThickness },
        position: { x: 0, y: wallHeight / 2, z: depth / 2 + wallThickness / 2 },
      },
      {
        size: { x: wallThickness, y: wallHeight, z: depth },
        position: { x: -width / 2 - wallThickness / 2, y: wallHeight / 2, z: 0 },
      },
      {
        size: { x: wallThickness, y: wallHeight, z: depth },
        position: { x: width / 2 + wallThickness / 2, y: wallHeight / 2, z: 0 },
      },
    ];

    for (const wall of wallDefinitions) {
      this.object.add(this.createBoxMesh(wall.size, wall.position, options.wallColor));
      this.physicsHandles.push(physics.createFixedBox({ ...wall, friction: 0.5 }));
    }
  }

  private createObstacle(physics: PhysicsWorld, obstacle: StageObstacleDefinition): void {
    if (obstacle.kind === 'table') {
      this.object.add(this.createTableMesh(obstacle));
    } else {
      this.object.add(this.createCrateMesh(obstacle));
    }

    this.physicsHandles.push(physics.createFixedBox({
      position: obstacle.position,
      size: obstacle.size,
      friction: 0.7,
    }));
  }

  private createDioramaFinish(options: StageDefinition): void {
    const style = options.visualStyle;
    if (style === undefined) {
      return;
    }

    this.object.add(this.createBoxMesh(
      { x: options.width + 0.45, y: 0.18, z: options.depth + 0.45 },
      { x: 0, y: -options.floorThickness - 0.05, z: 0 },
      style.plinthColor,
    ));

    if (style.floorLineColor !== undefined) {
      const lineHeight = 0.012;
      const spacing = 2;
      for (let x = -options.width / 2 + spacing; x < options.width / 2; x += spacing) {
        this.object.add(this.createBoxMesh(
          { x: 0.018, y: lineHeight, z: options.depth },
          { x, y: lineHeight / 2, z: 0 },
          style.floorLineColor,
        ));
      }
      for (let z = -options.depth / 2 + spacing; z < options.depth / 2; z += spacing) {
        this.object.add(this.createBoxMesh(
          { x: options.width, y: lineHeight, z: 0.018 },
          { x: 0, y: lineHeight / 2, z },
          style.floorLineColor,
        ));
      }
    }

    if (style.wallTrimColor !== undefined) {
      const trimHeight = 0.22;
      const trimDepth = 0.07;
      const trimY = trimHeight / 2;
      for (const z of [-options.depth / 2 + trimDepth / 2, options.depth / 2 - trimDepth / 2]) {
        this.object.add(this.createBoxMesh(
          { x: options.width, y: trimHeight, z: trimDepth },
          { x: 0, y: trimY, z },
          style.wallTrimColor,
        ));
      }
      for (const x of [-options.width / 2 + trimDepth / 2, options.width / 2 - trimDepth / 2]) {
        this.object.add(this.createBoxMesh(
          { x: trimDepth, y: trimHeight, z: options.depth },
          { x, y: trimY, z: 0 },
          style.wallTrimColor,
        ));
      }
    }
  }

  private createDecoration(definition: StageDecorationDefinition): Group {
    const group = new Group();
    group.name = `StageDecoration:${definition.kind}`;
    group.position.set(
      definition.position.x,
      definition.position.y,
      definition.position.z,
    );
    group.rotation.y = definition.rotationY ?? 0;
    if (definition.scale !== undefined) {
      group.scale.set(definition.scale.x, definition.scale.y, definition.scale.z);
    }

    const secondaryColor = definition.secondaryColor ?? new Color(definition.primaryColor)
      .offsetHSL(0, 0, -0.12)
      .getHex();
    if (definition.kind === 'rug') {
      group.add(this.createBoxMesh(
        { x: 3.8, y: 0.035, z: 2.5 },
        { x: 0, y: 0.018, z: 0 },
        definition.primaryColor,
      ));
      group.add(this.createBoxMesh(
        { x: 3.25, y: 0.012, z: 0.08 },
        { x: 0, y: 0.043, z: 0 },
        secondaryColor,
      ));
    } else if (definition.kind === 'plant') {
      const pot = new Mesh(
        new CylinderGeometry(0.25, 0.19, 0.38, 10),
        new MeshStandardMaterial({ color: secondaryColor, roughness: 0.9, metalness: 0 }),
      );
      pot.position.y = 0.19;
      group.add(pot);
      for (const [x, y, z, scale] of [
        [-0.11, 0.52, 0, 0.28],
        [0.12, 0.57, 0.03, 0.3],
        [0, 0.7, -0.04, 0.27],
      ] as const) {
        const leaf = new Mesh(
          new IcosahedronGeometry(scale, 1),
          new MeshStandardMaterial({ color: definition.primaryColor, roughness: 0.94, metalness: 0 }),
        );
        leaf.position.set(x, y, z);
        group.add(leaf);
      }
    } else if (definition.kind === 'table-setting') {
      const plate = new Mesh(
        new CylinderGeometry(0.28, 0.24, 0.055, 20),
        new MeshStandardMaterial({ color: definition.primaryColor, roughness: 0.72, metalness: 0 }),
      );
      plate.position.set(-0.25, 0.03, 0);
      const cup = new Mesh(
        new CylinderGeometry(0.1, 0.085, 0.22, 14),
        new MeshStandardMaterial({ color: secondaryColor, roughness: 0.76, metalness: 0 }),
      );
      cup.position.set(0.25, 0.11, 0.02);
      group.add(plate, cup);
    } else if (definition.kind === 'wall-art') {
      group.add(this.createBoxMesh(
        { x: 1.15, y: 0.8, z: 0.08 },
        { x: 0, y: 0, z: 0 },
        secondaryColor,
      ));
      group.add(this.createBoxMesh(
        { x: 0.91, y: 0.57, z: 0.035 },
        { x: 0, y: 0, z: 0.055 },
        definition.primaryColor,
      ));
    } else if (definition.kind === 'shelf') {
      group.add(this.createBoxMesh(
        { x: 2.2, y: 0.12, z: 0.42 },
        { x: 0, y: 0, z: 0 },
        definition.primaryColor,
      ));
      for (const x of [-0.72, 0, 0.72]) {
        const jar = new Mesh(
          new CylinderGeometry(0.14, 0.16, 0.34, 10),
          new MeshStandardMaterial({ color: secondaryColor, roughness: 0.8, metalness: 0 }),
        );
        jar.position.set(x, 0.23, 0);
        group.add(jar);
      }
    } else if (definition.kind === 'pendant') {
      group.add(this.createBoxMesh(
        { x: 0.035, y: 0.8, z: 0.035 },
        { x: 0, y: 0.4, z: 0 },
        secondaryColor,
      ));
      const shade = new Mesh(
        new CylinderGeometry(0.18, 0.42, 0.3, 16, 1, true),
        new MeshStandardMaterial({ color: definition.primaryColor, roughness: 0.72, metalness: 0 }),
      );
      shade.position.y = -0.08;
      group.add(shade);
      const bulb = new Mesh(
        new SphereGeometry(0.1, 12, 8),
        new MeshStandardMaterial({
          color: 0xffe1a6,
          emissive: 0x6f441a,
          emissiveIntensity: 0.7,
          roughness: 0.5,
        }),
      );
      bulb.position.y = -0.18;
      group.add(bulb);
    } else {
      const seatHeight = 0.46;
      group.add(this.createBoxMesh(
        { x: 0.68, y: 0.12, z: 0.64 },
        { x: 0, y: seatHeight, z: 0 },
        definition.primaryColor,
      ));
      group.add(this.createBoxMesh(
        { x: 0.68, y: 0.62, z: 0.1 },
        { x: 0, y: 0.75, z: -0.27 },
        definition.primaryColor,
      ));
      for (const x of [-0.25, 0.25]) {
        for (const z of [-0.22, 0.22]) {
          group.add(this.createBoxMesh(
            { x: 0.09, y: 0.45, z: 0.09 },
            { x, y: 0.225, z },
            secondaryColor,
          ));
        }
      }
    }

    group.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return group;
  }

  private createTableMesh(obstacle: StageObstacleDefinition): Group {
    const table = new Group();
    table.position.set(obstacle.position.x, 0, obstacle.position.z);

    const topThickness = 0.22;
    const top = this.createBoxMesh(
      { x: obstacle.size.x, y: topThickness, z: obstacle.size.z },
      { x: 0, y: obstacle.size.y - topThickness / 2, z: 0 },
      obstacle.color,
    );
    table.add(top);

    const legHeight = obstacle.size.y - topThickness;
    const legWidth = Math.min(0.22, obstacle.size.x * 0.13, obstacle.size.z * 0.18);
    const insetX = obstacle.size.x / 2 - legWidth * 1.15;
    const insetZ = obstacle.size.z / 2 - legWidth * 1.15;
    const legColor = new Color(obstacle.color).offsetHSL(0, 0, -TABLE_LEG_DARKEN).getHex();

    for (const x of [-insetX, insetX]) {
      for (const z of [-insetZ, insetZ]) {
        table.add(this.createBoxMesh(
          { x: legWidth, y: legHeight, z: legWidth },
          { x, y: legHeight / 2, z },
          legColor,
        ));
      }
    }

    return table;
  }

  private createCrateMesh(obstacle: StageObstacleDefinition): Mesh {
    return this.createBoxMesh(obstacle.size, obstacle.position, obstacle.color);
  }

  private createBoxMesh(
    size: { readonly x: number; readonly y: number; readonly z: number },
    position: { readonly x: number; readonly y: number; readonly z: number },
    color: number,
  ): Mesh {
    const geometry = new BoxGeometry(size.x, size.y, size.z);
    const material = new MeshStandardMaterial({ color, roughness: 0.82 });
    const mesh = new Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
}
