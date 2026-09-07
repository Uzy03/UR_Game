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
    const itemsById = new Map(
      definition.stage.items.map((item) => [item.id, item] as const),
    );
    const placePointIds = new Set(definition.stage.placePoints.map((point) => point.id));
    const stationIds = new Set<string>();
    const stationsById = new Map(
      (definition.processingStations ?? []).map((station) => [station.id, station] as const),
    );
    for (const station of definition.processingStations ?? []) {
      this.assertUniqueId(station.id, stationIds, `Scene "${definition.id}" Processing Station`);
      this.assertVector(
        station.position,
        `Scene "${definition.id}" Processing Station "${station.id}" position`,
      );
      this.assertPositive(
        station.processingDurationSeconds,
        `Scene "${definition.id}" Processing Station "${station.id}" duration`,
      );
      if (station.acceptedItemIds.length === 0) {
        throw new Error(
          `Scene "${definition.id}" Processing Station "${station.id}" must accept at least one Item.`,
        );
      }
      const acceptedItemIds = new Set<string>();
      for (const itemId of station.acceptedItemIds) {
        this.assertUniqueId(
          itemId,
          acceptedItemIds,
          `Scene "${definition.id}" Processing Station "${station.id}" accepted Item`,
        );
        if (!itemIds.has(itemId)) {
          throw new Error(
            `Scene "${definition.id}" Processing Station "${station.id}" references unknown Item "${itemId}".`,
          );
        }
      }
    }

    const assemblyStationIds = new Set<string>();
    const assemblyOutputItemIds = new Set<string>();
    const assemblyStationsById = new Map(
      (definition.assemblyStations ?? []).map((station) => [station.id, station] as const),
    );
    for (const station of definition.assemblyStations ?? []) {
      this.assertUniqueId(station.id, assemblyStationIds, `Scene "${definition.id}" Assembly Station`);
      this.assertVector(
        station.position,
        `Scene "${definition.id}" Assembly Station "${station.id}" position`,
      );
      this.assertPositive(
        station.combineDurationSeconds,
        `Scene "${definition.id}" Assembly Station "${station.id}" duration`,
      );
      if (!Array.isArray(station.inputItemIds) || station.inputItemIds.length !== 2) {
        throw new Error(
          `Scene "${definition.id}" Assembly Station "${station.id}" must have exactly two input Items.`,
        );
      }
      const [inputAId, inputBId] = station.inputItemIds;
      if (inputAId === inputBId) {
        throw new Error(
          `Scene "${definition.id}" Assembly Station "${station.id}" must use two different input Items.`,
        );
      }
      for (const inputId of station.inputItemIds) {
        const inputItem = itemsById.get(inputId);
        if (inputItem === undefined) {
          throw new Error(
            `Scene "${definition.id}" Assembly Station "${station.id}" references unknown input Item "${inputId}".`,
          );
        }
        if (inputItem.initialActive === false) {
          throw new Error(
            `Scene "${definition.id}" Assembly Station "${station.id}" input Item "${inputId}" must start active.`,
          );
        }
      }
      const outputItem = itemsById.get(station.outputItemId);
      if (outputItem === undefined) {
        throw new Error(
          `Scene "${definition.id}" Assembly Station "${station.id}" references unknown output Item "${station.outputItemId}".`,
        );
      }
      if (station.inputItemIds.includes(station.outputItemId)) {
        throw new Error(
          `Scene "${definition.id}" Assembly Station "${station.id}" output must differ from its inputs.`,
        );
      }
      if (outputItem.initialActive !== false) {
        throw new Error(
          `Scene "${definition.id}" Assembly Station "${station.id}" output Item "${station.outputItemId}" must start inactive.`,
        );
      }
      this.assertUniqueId(
        station.outputItemId,
        assemblyOutputItemIds,
        `Scene "${definition.id}" Assembly output Item`,
      );
    }

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
      this.assertOptionalBoolean(
        task.preserveWorldOnFirstAttempt,
        `Scene "${definition.id}" Task "${task.id}" preserveWorldOnFirstAttempt`,
      );
      this.assertOptionalBoolean(
        task.preserveItemProcessingOnRetry,
        `Scene "${definition.id}" Task "${task.id}" preserveItemProcessingOnRetry`,
      );
      this.assertOptionalBoolean(
        task.preserveItemRuntimeOnRetry,
        `Scene "${definition.id}" Task "${task.id}" preserveItemRuntimeOnRetry`,
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

    for (const task of definition.processingTasks ?? []) {
      this.assertUniqueId(task.id, taskIds, `Scene "${definition.id}" Task`);
      if (task.label.trim().length === 0) {
        throw new Error(`Scene "${definition.id}" Task "${task.id}" has an empty label.`);
      }
      this.assertPositive(
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
      if (task.requiredItemIds.length === 0) {
        throw new Error(`Scene "${definition.id}" Task "${task.id}" requires no Items.`);
      }
      if (task.stationIds.length === 0) {
        throw new Error(`Scene "${definition.id}" Task "${task.id}" references no Stations.`);
      }

      const requiredItemIds = new Set<string>();
      for (const itemId of task.requiredItemIds) {
        this.assertUniqueId(
          itemId,
          requiredItemIds,
          `Scene "${definition.id}" Task "${task.id}" required Item`,
        );
        if (!itemIds.has(itemId)) {
          throw new Error(
            `Scene "${definition.id}" Task "${task.id}" references unknown Item "${itemId}".`,
          );
        }
      }

      const referencedStationIds = new Set<string>();
      const referencedStations = task.stationIds.map((stationId) => {
        this.assertUniqueId(
          stationId,
          referencedStationIds,
          `Scene "${definition.id}" Task "${task.id}" Station`,
        );
        const station = stationsById.get(stationId);
        if (station === undefined) {
          throw new Error(
            `Scene "${definition.id}" Task "${task.id}" references unknown Processing Station "${stationId}".`,
          );
        }
        return station;
      });

      for (const itemId of requiredItemIds) {
        const accepted = referencedStations.some(
          (station) => station.acceptedItemIds.includes(itemId),
        );
        if (!accepted) {
          throw new Error(
            `Scene "${definition.id}" Task "${task.id}" has no Station that accepts Item "${itemId}".`,
          );
        }
      }
    }

    for (const task of definition.assemblyTasks ?? []) {
      this.assertUniqueId(task.id, taskIds, `Scene "${definition.id}" Task`);
      if (task.label.trim().length === 0) {
        throw new Error(`Scene "${definition.id}" Task "${task.id}" has an empty label.`);
      }
      this.assertPositive(
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
      if (task.stationIds.length === 0) {
        throw new Error(`Scene "${definition.id}" Task "${task.id}" references no Stations.`);
      }
      const referencedStationIds = new Set<string>();
      for (const stationId of task.stationIds) {
        this.assertUniqueId(
          stationId,
          referencedStationIds,
          `Scene "${definition.id}" Task "${task.id}" Assembly Station`,
        );
        if (!assemblyStationsById.has(stationId)) {
          throw new Error(
            `Scene "${definition.id}" Task "${task.id}" references unknown Assembly Station "${stationId}".`,
          );
        }
      }
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

    if (stage.visualStyle !== undefined) {
      this.assertColor(stage.visualStyle.plinthColor, `Scene "${sceneId}" plinth color`);
      if (stage.visualStyle.floorLineColor !== undefined) {
        this.assertColor(stage.visualStyle.floorLineColor, `Scene "${sceneId}" floor line color`);
      }
      if (stage.visualStyle.wallTrimColor !== undefined) {
        this.assertColor(stage.visualStyle.wallTrimColor, `Scene "${sceneId}" wall trim color`);
      }
    }

    for (const [index, decoration] of (stage.decorations ?? []).entries()) {
      const label = `Scene "${sceneId}" decoration ${index}`;
      this.assertVector(decoration.position, `${label} position`);
      if (decoration.rotationY !== undefined) {
        this.assertFinite(decoration.rotationY, `${label} rotationY`);
      }
      if (decoration.scale !== undefined) {
        this.assertPositiveVector(decoration.scale, `${label} scale`);
      }
      this.assertColor(decoration.primaryColor, `${label} primary color`);
      if (decoration.secondaryColor !== undefined) {
        this.assertColor(decoration.secondaryColor, `${label} secondary color`);
      }
    }

    for (const [index, obstacle] of stage.obstacles.entries()) {
      this.assertVector(obstacle.position, `Scene "${sceneId}" obstacle ${index} position`);
      this.assertPositiveVector(obstacle.size, `Scene "${sceneId}" obstacle ${index} size`);
      this.assertColor(obstacle.color, `Scene "${sceneId}" obstacle ${index} color`);
    }

    const itemIds = new Set<string>();
    for (const item of stage.items) {
      this.assertUniqueId(item.id, itemIds, `Scene "${sceneId}" Item`);
      this.assertVector(item.position, `Scene "${sceneId}" Item "${item.id}" position`);
      if (
        item.initialProcessingState !== undefined
        && item.initialProcessingState !== 'raw'
        && item.initialProcessingState !== 'processed'
      ) {
        throw new Error(
          `Scene "${sceneId}" Item "${item.id}" has an invalid initial processing state.`,
        );
      }
      this.assertOptionalBoolean(
        item.initialActive,
        `Scene "${sceneId}" Item "${item.id}" initialActive`,
      );
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

  private assertOptionalBoolean(value: boolean | undefined, label: string): void {
    if (value !== undefined && typeof value !== 'boolean') {
      throw new Error(`${label} must be a boolean when provided.`);
    }
  }
}
