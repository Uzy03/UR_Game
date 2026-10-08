import type { EventRunner } from '../events/EventRunner';
import type { EventSequence } from '../events/EventTypes';
import type { CheckpointDefinition } from '../save/CheckpointTypes';
import type { WorldRoute, WorldRouteNodeDefinition } from '../world/WorldRoute';
import { assertRuntimeOnlyResume, projectReplaySequence } from './ReplaySequence';

interface ReplayDependencies {
  readonly route: WorldRoute;
  readonly progress: { readonly completedNodeIds: readonly string[] };
  readonly saveStore: { load(): { readonly checkpointId: string } | null };
  readonly checkpoints: { getCheckpoint(id: string): CheckpointDefinition | undefined };
  readonly runner: EventRunner;
  readonly isGameActive: () => boolean;
  readonly validateSequence: (sequence: EventSequence) => void;
  readonly startRuntime: (sequence: EventSequence) => void;
  readonly restoreRuntime: (checkpoint: CheckpointDefinition) => boolean;
}

export interface ReplayActions {
  readonly activeNode: WorldRouteNodeDefinition | null;
  start(nodeId: string): string | null;
  exit(): void;
}

export class ReplayController implements ReplayActions {
  private session: { nodeId: string; checkpointId: string; sequenceId: string } | null = null;

  public constructor(private readonly dependencies: ReplayDependencies) {
    dependencies.runner.setCompletedHandler(this.handleCompleted);
  }

  public get activeNode(): WorldRouteNodeDefinition | null {
    return this.session === null ? null : this.dependencies.route.getNode(this.session.nodeId) ?? null;
  }

  public start(nodeId: string): string | null {
    if (this.session !== null) return 'Exit the current Replay first.';
    if (!this.dependencies.isGameActive()) return 'Start a game before Replay.';
    const node = this.dependencies.route.getNode(nodeId);
    if (node === undefined || !this.dependencies.progress.completedNodeIds.includes(nodeId)) {
      return 'Only cleared places can be replayed.';
    }
    let sequence: EventSequence;
    let checkpoint: CheckpointDefinition;
    try {
      const saved = this.dependencies.saveStore.load();
      const found = saved === null ? undefined : this.dependencies.checkpoints.getCheckpoint(saved.checkpointId);
      if (found === undefined) throw new Error('The saved campaign checkpoint is unavailable.');
      checkpoint = found;
      assertRuntimeOnlyResume(checkpoint.resumeSequence);
      if (checkpoint.resumeSequence !== null) this.dependencies.validateSequence(checkpoint.resumeSequence);
      sequence = projectReplaySequence(node.entrySequence);
      this.dependencies.validateSequence(sequence);
    } catch (error: unknown) {
      return error instanceof Error ? error.message : String(error);
    }
    this.session = { nodeId, checkpointId: checkpoint.id, sequenceId: sequence.id };
    try {
      this.dependencies.startRuntime(sequence);
      return null;
    } catch (error: unknown) {
      console.error('[ReplayController] Replay could not start.', error);
      const restored = this.exit();
      return restored ? 'Replay could not start. Returned to your saved campaign checkpoint.'
        : 'Replay could not start. Return to the title and retry Continue.';
    }
  }

  public exit(): boolean {
    const session = this.session;
    if (session === null) return true;
    this.session = null;
    const checkpoint = this.dependencies.checkpoints.getCheckpoint(session.checkpointId);
    if (checkpoint === undefined) throw new Error('Captured Replay checkpoint is unavailable.');
    return this.dependencies.restoreRuntime(checkpoint);
  }

  public clear(): void { this.session = null; }

  public update(): void {
    if (this.session !== null && this.dependencies.runner.state === 'error') {
      console.error('[ReplayController] Returning from failed Replay.', this.dependencies.runner.lastError);
      this.exit();
    }
  }

  private readonly handleCompleted = (sequenceId: string): void => {
    if (this.session?.sequenceId === sequenceId) this.exit();
  };
}
