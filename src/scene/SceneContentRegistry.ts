import type { StageDefinition, Vector3Config } from '../stage/StageTypes';
import type { SceneDefinition } from './SceneTypes';

export class SceneContentRegistry {
  private readonly scenes = new Map<string, SceneDefinition>();

  public constructor(definitions: readonly SceneDefinition[]) {
    for (const definition of definitions) {
      this.validateScene(definition);
      if (this.scenes.has(definition.id)) {
        throw new Error(`Duplicate Scene ID "${definition.id}".`);
      }
      this.scenes.set(definition.id, definition);
    }
  }

  public getScene(sceneId: string): SceneDefinition | undefined {
    return this.scenes.get(sceneId);
  }

  private validateScene(definition: SceneDefinition): void {
    this.assertId(definition.id, 'Scene');
    this.assertVector(definition.playerSpawn.position, `Scene "${definition.id}" player spawn`);
    this.assertFinite(definition.playerSpawn.facing, `Scene "${definition.id}" player facing`);
    this.validateStage(definition.id, definition.stage);

    const npcIds = new Set<string>();
    for (const npc of definition.npcs) {
      this.assertUniqueId(npc.id, npcIds, `Scene "${definition.id}" NPC`);
      if (npc.displayName.trim().length === 0) {
        throw new Error(`Scene "${definition.id}" NPC "${npc.id}" has an empty display name.`);
      }
      this.assertVector(npc.position, `Scene "${definition.id}" NPC "${npc.id}" position`);
      this.assertNonNegative(npc.moveSpeed, `Scene "${definition.id}" NPC "${npc.id}" move speed`);
      this.assertNonNegative(
        npc.turnSharpness,
        `Scene "${definition.id}" NPC "${npc.id}" turn sharpness`,
      );
    }

    const itemIds = new Set(definition.stage.items.map((item) => item.id));
    const placePointIds = new Set(definition.stage.placePoints.map((point) => point.id));
    const taskIds = new Set<string>();
    for (const task of definition.placementTasks) {
      this.assertUniqueId(task.id, taskIds, `Scene "${definition.id}" Task`);
      if (task.label.trim().length === 0) {
        throw new Error(`Scene "${definition.id}" Task "${task.id}" has an empty label.`);
      }
      this.assertNonNegative(
        task.durationSeconds,
        `Scene "${definition.id}" Task "${task.id}" duration`,
      );
      this.assertVector(
        task.attemptPlayerPosition,
        `Scene "${definition.id}" Task "${task.id}" attempt player position`,
      );
      this.assertFinite(
        task.attemptPlayerFacing,
        `Scene "${definition.id}" Task "${task.id}" attempt player facing`,
      );

      for (const itemId of task.requiredItemIds) {
        if (!itemIds.has(itemId)) {
          throw new Error(
            `Scene "${definition.id}" Task "${task.id}" references unknown Item "${itemId}".`,
          );
        }
      }
      for (const placePointId of task.targetPlacePointIds) {
        if (!placePointIds.has(placePointId)) {
          throw new Error(
            `Scene "${definition.id}" Task "${task.id}" references unknown PlacePoint "${placePointId}".`,
          );
        }
      }
    }

    for (const task of definition.reachTasks ?? []) {
      this.assertUniqueId(task.id, taskIds, `Scene "${definition.id}" Task`);
      if (task.label.trim().length === 0) {
        throw new Error(`Scene "${definition.id}" Task "${task.id}" has an empty label.`);
      }
      this.assertVector(
        task.targetPosition,
        `Scene "${definition.id}" Task "${task.id}" target position`,
      );
      this.assertPositive(task.radius, `Scene "${definition.id}" Task "${task.id}" radius`);
    }
  }

  private validateStage(sceneId: string, stage: StageDefinition): void {
    this.assertPositive(stage.width, `Scene "${sceneId}" stage width`);
    this.assertPositive(stage.depth, `Scene "${sceneId}" stage depth`);
    this.assertPositive(stage.floorThickness, `Scene "${sceneId}" floor thickness`);
    this.assertPositive(stage.wallThickness, `Scene "${sceneId}" wall thickness`);
    this.assertPositive(stage.wallHeight, `Scene "${sceneId}" wall height`);
    this.assertColor(stage.floorColor, `Scene "${sceneId}" floor color`);
    this.assertColor(stage.wallColor, `Scene "${sceneId}" wall color`);

    for (const [index, obstacle] of stage.obstacles.entries()) {
      this.assertVector(obstacle.position, `Scene "${sceneId}" obstacle ${index} position`);
      this.assertPositiveVector(obstacle.size, `Scene "${sceneId}" obstacle ${index} size`);
      this.assertColor(obstacle.color, `Scene "${sceneId}" obstacle ${index} color`);
    }

    const itemIds = new Set<string>();
    for (const item of stage.items) {
      this.assertUniqueId(item.id, itemIds, `Scene "${sceneId}" Item`);
      this.assertVector(item.position, `Scene "${sceneId}" Item "${item.id}" position`);
    }

    const placePointIds = new Set<string>();
    for (const point of stage.placePoints) {
      this.assertUniqueId(point.id, placePointIds, `Scene "${sceneId}" PlacePoint`);
      this.assertVector(point.position, `Scene "${sceneId}" PlacePoint "${point.id}" position`);
    }
  }

  private assertUniqueId(id: string, ids: Set<string>, label: string): void {
    this.assertId(id, label);
    if (ids.has(id)) {
      throw new Error(`${label} ID "${id}" is duplicated.`);
    }
    ids.add(id);
  }

  private assertId(id: string, label: string): void {
    if (id.trim().length === 0) {
      throw new Error(`${label} ID must not be empty.`);
    }
  }

  private assertVector(vector: Vector3Config, label: string): void {
    this.assertFinite(vector.x, `${label}.x`);
    this.assertFinite(vector.y, `${label}.y`);
    this.assertFinite(vector.z, `${label}.z`);
  }

  private assertPositiveVector(vector: Vector3Config, label: string): void {
    this.assertPositive(vector.x, `${label}.x`);
    this.assertPositive(vector.y, `${label}.y`);
    this.assertPositive(vector.z, `${label}.z`);
  }

  private assertFinite(value: number, label: string): void {
    if (!Number.isFinite(value)) {
      throw new Error(`${label} must be finite.`);
    }
  }

  private assertPositive(value: number, label: string): void {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`${label} must be a finite positive number.`);
    }
  }

  private assertNonNegative(value: number, label: string): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${label} must be a finite non-negative number.`);
    }
  }

  private assertColor(value: number, label: string): void {
    if (!Number.isInteger(value) || value < 0 || value > 0xffffff) {
      throw new Error(`${label} must be an integer RGB color.`);
    }
  }
}
