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
import type { StageDefinition, StageObstacleDefinition } from './StageTypes';

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

      for (const obstacle of options.obstacles) {
        this.createObstacle(physics, obstacle);
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
