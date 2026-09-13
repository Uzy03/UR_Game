import type { EventSequence } from '../events/EventTypes';
import type { Vector3Config } from '../stage/StageTypes';

export interface WorldRouteNodeDefinition {
  readonly id: string;
  readonly label: string;
  readonly stageLabel: string;
  readonly position: Vector3Config;
  readonly vehicleSpawn: Vector3Config;
  readonly completionCheckpointId: string;
  readonly entrySequence: EventSequence;
}

export interface WorldRouteDefinition {
  readonly initialCheckpointId: string;
  readonly initialVehicleSpawn: Vector3Config;
  readonly nodes: readonly WorldRouteNodeDefinition[];
}

export type WorldRouteNodeState = 'locked' | 'available' | 'completed';

export class WorldRoute {
  public readonly nodes: readonly WorldRouteNodeDefinition[];
  private readonly nodesById = new Map<string, WorldRouteNodeDefinition>();
  private readonly completedCountByCheckpoint = new Map<string, number>();

  public constructor(public readonly definition: WorldRouteDefinition) {
    this.assertId(definition.initialCheckpointId, 'World route initial Checkpoint');
    this.assertVector(definition.initialVehicleSpawn, 'World route initial vehicle spawn');
    if (definition.nodes.length === 0) {
      throw new Error('World route must contain at least one node.');
    }

    this.completedCountByCheckpoint.set(definition.initialCheckpointId, 0);
    for (const [index, node] of definition.nodes.entries()) {
      this.validateNode(node, index);
      if (this.nodesById.has(node.id)) {
        throw new Error(`Duplicate World route node ID "${node.id}".`);
      }
      if ([...this.nodesById.values()].some(({ label }) => label === node.label)) {
        throw new Error(`Duplicate World route node label "${node.label}".`);
      }
      if (this.completedCountByCheckpoint.has(node.completionCheckpointId)) {
        throw new Error(
          `Duplicate World route completion Checkpoint "${node.completionCheckpointId}".`,
        );
      }
      this.nodesById.set(node.id, node);
      this.completedCountByCheckpoint.set(node.completionCheckpointId, index + 1);
    }
    this.nodes = [...definition.nodes];
  }

  public get nodeIds(): readonly string[] {
    return this.nodes.map(({ id }) => id);
  }

  public getNode(nodeId: string): WorldRouteNodeDefinition | undefined {
    return this.nodesById.get(nodeId);
  }

  public getCompletedNodeIdsForCheckpoint(checkpointId: string): readonly string[] | null {
    const completedCount = this.completedCountByCheckpoint.get(checkpointId);
    return completedCount === undefined
      ? null
      : this.nodes.slice(0, completedCount).map(({ id }) => id);
  }

  public getVehicleSpawn(completedNodeIds: readonly string[]): Vector3Config {
    if (completedNodeIds.length === 0) {
      return this.definition.initialVehicleSpawn;
    }
    return this.nodes[completedNodeIds.length - 1]?.vehicleSpawn
      ?? this.definition.initialVehicleSpawn;
  }

  public getNodeState(nodeId: string, completedNodeIds: readonly string[]): WorldRouteNodeState {
    const index = this.nodes.findIndex((node) => node.id === nodeId);
    if (index < 0) {
      throw new Error(`Unknown World route node "${nodeId}".`);
    }
    if (index < completedNodeIds.length) {
      return 'completed';
    }
    return index === completedNodeIds.length ? 'available' : 'locked';
  }

  public isValidCompletedPrefix(completedNodeIds: readonly string[]): boolean {
    return completedNodeIds.length <= this.nodes.length
      && completedNodeIds.every((nodeId, index) => this.nodes[index]?.id === nodeId);
  }

  private validateNode(node: WorldRouteNodeDefinition, index: number): void {
    const label = `World route node ${index}`;
    this.assertId(node.id, label);
    this.assertNonEmpty(node.label, `${label} label`);
    this.assertNonEmpty(node.stageLabel, `${label} stage label`);
    this.assertVector(node.position, `${label} position`);
    this.assertVector(node.vehicleSpawn, `${label} vehicle spawn`);
    this.assertId(node.completionCheckpointId, `${label} completion Checkpoint`);
    this.assertId(node.entrySequence.id, `${label} entry sequence`);
    if (!Array.isArray(node.entrySequence.events) || node.entrySequence.events.length === 0) {
      throw new Error(`${label} entry sequence must contain events.`);
    }

    let checkpointIndex = -1;
    for (let eventIndex = 0; eventIndex < node.entrySequence.events.length; eventIndex += 1) {
      if (node.entrySequence.events[eventIndex]?.type === 'set_checkpoint') {
        checkpointIndex = eventIndex;
      }
    }
    const completionIndex = node.entrySequence.events.length - 1;
    const completionEvent = node.entrySequence.events[completionIndex];
    if (
      checkpointIndex < 0
      || node.entrySequence.events[checkpointIndex]?.type !== 'set_checkpoint'
      || node.entrySequence.events[checkpointIndex].checkpointId !== node.completionCheckpointId
    ) {
      throw new Error(
        `${label} entry sequence must save completion Checkpoint "${node.completionCheckpointId}".`,
      );
    }
    if (
      completionEvent?.type !== 'world_map'
      || completionEvent.action !== 'complete_node'
      || completionEvent.nodeId !== node.id
      || checkpointIndex >= completionIndex
    ) {
      throw new Error(
        `${label} entry sequence must finish by completing node "${node.id}" after its Checkpoint.`,
      );
    }
  }

  private assertId(value: string, label: string): void {
    this.assertNonEmpty(value, `${label} ID`);
  }

  private assertNonEmpty(value: string, label: string): void {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`${label} must be a non-empty string.`);
    }
  }

  private assertVector(value: Vector3Config, label: string): void {
    if (!Number.isFinite(value.x) || !Number.isFinite(value.y) || !Number.isFinite(value.z)) {
      throw new Error(`${label} must contain finite coordinates.`);
    }
  }
}
