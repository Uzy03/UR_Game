import {
  BoxGeometry,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  type Scene,
} from 'three';
import type { StageObstacleConfig } from '../config/gameConfig';
import type { PhysicsWorld } from '../physics/PhysicsWorld';

interface StageOptions {
  readonly width: number;
  readonly depth: number;
  readonly floorThickness: number;
  readonly wallThickness: number;
  readonly wallHeight: number;
  readonly obstacles: readonly StageObstacleConfig[];
}

const FLOOR_COLOR = 0xf1e8d7;
const WALL_COLOR = 0x8bb8b4;
const TABLE_LEG_DARKEN = 0.15;

export class Stage {
  public readonly object = new Group();

  public constructor(
    scene: Scene,
    physics: PhysicsWorld,
    options: StageOptions,
  ) {
    this.object.name = 'Stage';
    scene.add(this.object);

    this.createFloor(physics, options);
    this.createWalls(physics, options);

    for (const obstacle of options.obstacles) {
      this.createObstacle(physics, obstacle);
    }
  }

  private createFloor(physics: PhysicsWorld, options: StageOptions): void {
    const size = { x: options.width, y: options.floorThickness, z: options.depth };
    const position = { x: 0, y: -options.floorThickness / 2, z: 0 };
    this.object.add(this.createBoxMesh(size, position, FLOOR_COLOR));
    physics.createFixedBox({ size, position, friction: 0.9 });
  }

  private createWalls(physics: PhysicsWorld, options: StageOptions): void {
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
      this.object.add(this.createBoxMesh(wall.size, wall.position, WALL_COLOR));
      physics.createFixedBox({ ...wall, friction: 0.5 });
    }
  }

  private createObstacle(physics: PhysicsWorld, obstacle: StageObstacleConfig): void {
    if (obstacle.kind === 'table') {
      this.object.add(this.createTableMesh(obstacle));
    } else {
      this.object.add(this.createCrateMesh(obstacle));
    }

    physics.createFixedBox({
      position: obstacle.position,
      size: obstacle.size,
      friction: 0.7,
    });
  }

  private createTableMesh(obstacle: StageObstacleConfig): Group {
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

  private createCrateMesh(obstacle: StageObstacleConfig): Mesh {
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
