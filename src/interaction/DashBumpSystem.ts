import { Vector3 } from 'three';
import type { NPCController } from '../npc/NPCController';
import type { PlayerController } from '../player/PlayerController';

export interface DashBumpOptions {
  readonly combinedRadius: number;
  readonly npcVisualOffset: number;
  readonly recoverySeconds: number;
}

export class DashBumpSystem {
  private lastDashSequenceId = -1;
  private readonly hitNpcIds = new Set<string>();
  private readonly dashStartPosition = new Vector3();
  private readonly dashEndPosition = new Vector3();
  private readonly npcPosition = new Vector3();

  public constructor(
    private readonly player: PlayerController,
    private readonly npcs: ReadonlyMap<string, NPCController>,
    private readonly options: DashBumpOptions,
  ) {
    for (const [label, value] of Object.entries(options)) {
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`Dash bump ${label} must be a finite positive number.`);
      }
    }
  }

  public updateAfterPlayerResolution(): void {
    const dashFrame = this.player.dashFrameMotion;
    if (dashFrame.sequenceId !== this.lastDashSequenceId) {
      this.lastDashSequenceId = dashFrame.sequenceId;
      this.hitNpcIds.clear();
    }
    if (!dashFrame.active) {
      return;
    }

    let didHit = false;
    const radiusSquared = this.options.combinedRadius ** 2;
    this.dashStartPosition.set(dashFrame.start.x, 0, dashFrame.start.z);
    this.dashEndPosition.set(dashFrame.end.x, 0, dashFrame.end.z);
    this.player.object.parent?.localToWorld(this.dashStartPosition);
    this.player.object.parent?.localToWorld(this.dashEndPosition);
    for (const npc of this.npcs.values()) {
      if (this.hitNpcIds.has(npc.id)) {
        continue;
      }
      npc.object.getWorldPosition(this.npcPosition);
      const distanceSquared = planarPointToSegmentDistanceSquared(
        this.npcPosition.x,
        this.npcPosition.z,
        this.dashStartPosition.x,
        this.dashStartPosition.z,
        this.dashEndPosition.x,
        this.dashEndPosition.z,
      );
      if (distanceSquared > radiusSquared) {
        continue;
      }
      this.hitNpcIds.add(npc.id);
      npc.triggerDashBump(
        dashFrame.direction,
        this.options.npcVisualOffset,
        this.options.recoverySeconds,
      );
      didHit = true;
    }
    if (didHit) {
      this.player.cancelDashForBump();
    }
  }

  public reset(): void {
    this.lastDashSequenceId = -1;
    this.hitNpcIds.clear();
  }
}

function planarPointToSegmentDistanceSquared(
  pointX: number,
  pointZ: number,
  startX: number,
  startZ: number,
  endX: number,
  endZ: number,
): number {
  const segmentX = endX - startX;
  const segmentZ = endZ - startZ;
  const segmentLengthSquared = segmentX * segmentX + segmentZ * segmentZ;
  if (segmentLengthSquared <= Number.EPSILON) {
    return (pointX - endX) ** 2 + (pointZ - endZ) ** 2;
  }
  const progress = Math.min(1, Math.max(0, (
    (pointX - startX) * segmentX + (pointZ - startZ) * segmentZ
  ) / segmentLengthSquared));
  const closestX = startX + segmentX * progress;
  const closestZ = startZ + segmentZ * progress;
  return (pointX - closestX) ** 2 + (pointZ - closestZ) ** 2;
}
