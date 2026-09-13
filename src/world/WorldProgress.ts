import type { WorldRouteNodeDefinition, WorldRouteNodeState } from './WorldRoute';
import { WorldRoute } from './WorldRoute';
import {
  WORLD_PROGRESS_VERSION,
  type WorldProgressDataV1,
  type WorldProgressStore,
} from './WorldProgressStore';

export class WorldProgress {
  private completedIds: string[];

  public constructor(
    private readonly route: WorldRoute,
    private readonly store: WorldProgressStore,
  ) {
    this.completedIds = [...(store.load(route)?.completedNodeIds ?? [])];
  }

  public get snapshot(): WorldProgressDataV1 {
    return {
      version: WORLD_PROGRESS_VERSION,
      completedNodeIds: [...this.completedIds],
    };
  }

  public get completedNodeIds(): readonly string[] {
    return this.completedIds;
  }

  public get availableNode(): WorldRouteNodeDefinition | null {
    return this.route.nodes[this.completedIds.length] ?? null;
  }

  public getNodeState(nodeId: string): WorldRouteNodeState {
    return this.route.getNodeState(nodeId, this.completedIds);
  }

  public completeNode(nodeId: string): void {
    const available = this.availableNode;
    if (available === null || available.id !== nodeId) {
      throw new Error(`World route node "${nodeId}" is not currently available.`);
    }
    this.completedIds.push(nodeId);
    this.store.save(this.snapshot);
  }

  public restoreForCheckpoint(checkpointId: string): void {
    const reconstructed = this.route.getCompletedNodeIdsForCheckpoint(checkpointId);
    if (reconstructed === null || reconstructed.length === 0) {
      this.completedIds = [];
      this.store.clear();
      return;
    }
    this.completedIds = [...reconstructed];
    this.store.save(this.snapshot);
  }

  public reset(): void {
    this.completedIds = [];
    this.store.clear();
  }
}
