import {
  BoxGeometry,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
} from 'three';
import { disposeObject3D } from '../core/disposeObject3D';
import { PickableItem } from '../interaction/PickableItem';
import { PlacePoint } from '../interaction/PlacePoint';
import type { PhysicsBodyHandle, PhysicsWorld } from '../physics/PhysicsWorld';
import type {
  StageDefinition,
  StageObstacleDefinition,
} from './StageTypes';
import { createStageDecoration } from './createStageDecoration';

const TABLE_LEG_DARKEN = 0.15;

interface MeshShadowOptions {
  readonly castShadow: boolean;
  readonly receiveShadow: boolean;
}

const RECEIVE_ONLY_SHADOWS: MeshShadowOptions = {
  castShadow: false,
  receiveShadow: true,
};
const NO_SHADOWS: MeshShadowOptions = {
  castShadow: false,
  receiveShadow: false,
};

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
        this.object.add(createStageDecoration(decoration));
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
    this.object.add(this.createBoxMesh(
      size,
      position,
      options.floorColor,
      RECEIVE_ONLY_SHADOWS,
    ));
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
      this.object.add(this.createBoxMesh(
        wall.size,
        wall.position,
        options.wallColor,
        RECEIVE_ONLY_SHADOWS,
      ));
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
      NO_SHADOWS,
    ));

    if (style.floorLineColor !== undefined) {
      const lineHeight = 0.012;
      const spacing = 2;
      for (let x = -options.width / 2 + spacing; x < options.width / 2; x += spacing) {
        this.object.add(this.createBoxMesh(
          { x: 0.018, y: lineHeight, z: options.depth },
          { x, y: lineHeight / 2, z: 0 },
          style.floorLineColor,
          NO_SHADOWS,
        ));
      }
      for (let z = -options.depth / 2 + spacing; z < options.depth / 2; z += spacing) {
        this.object.add(this.createBoxMesh(
          { x: options.width, y: lineHeight, z: 0.018 },
          { x: 0, y: lineHeight / 2, z },
          style.floorLineColor,
          NO_SHADOWS,
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
          NO_SHADOWS,
        ));
      }
      for (const x of [-options.width / 2 + trimDepth / 2, options.width / 2 - trimDepth / 2]) {
        this.object.add(this.createBoxMesh(
          { x: trimDepth, y: trimHeight, z: options.depth },
          { x, y: trimY, z: 0 },
          style.wallTrimColor,
          NO_SHADOWS,
        ));
      }
    }
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
    shadows: MeshShadowOptions = { castShadow: true, receiveShadow: true },
  ): Mesh {
    const geometry = new BoxGeometry(size.x, size.y, size.z);
    const material = new MeshStandardMaterial({ color, roughness: 0.82 });
    const mesh = new Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    mesh.castShadow = shadows.castShadow;
    mesh.receiveShadow = shadows.receiveShadow;
    return mesh;
  }
}
