import { Vector3, type Object3D, type Vector3Like } from 'three';
import type { StageObstacleDefinition } from '../stage/StageTypes';
import type { PickableItem } from './PickableItem';
import type { PlacePoint } from './PlacePoint';
import {
  THROW_RECEIVER_PRIORITY,
  type ThrowAssistContext,
  type ThrowReceiver,
  type ThrowReceiverCandidate,
  type ThrowReceiverReservation,
} from './ThrowReceiver';

const ITEM_EDGE_INSET = 0.06;

export class TableThrowSurface implements ThrowReceiver {
  private readonly reservedPositions = new Map<PickableItem, Vector3>();

  public constructor(
    private readonly id: string,
    private readonly table: StageObstacleDefinition,
    private readonly allItems: readonly PickableItem[],
    private readonly semanticPlacePoints: readonly PlacePoint[],
    private readonly landingSpacing: number,
    private readonly assistRadius: number,
  ) {
    if (table.kind !== 'table') {
      throw new Error(`Throw surface "${id}" must use a table obstacle.`);
    }
  }

  public getThrowReceiverCandidate(
    item: PickableItem,
    context: ThrowAssistContext,
  ): ThrowReceiverCandidate | null {
    if (!item.isActive) {
      return null;
    }
    const inset = item.footprintRadius + ITEM_EDGE_INSET;
    const halfWidth = this.table.size.x / 2 - inset;
    const halfDepth = this.table.size.z / 2 - inset;
    if (halfWidth <= 0 || halfDepth <= 0) {
      return null;
    }

    const captureTarget = new Vector3(
      clamp(
        context.intendedLanding.x,
        this.table.position.x - halfWidth,
        this.table.position.x + halfWidth,
      ),
      this.table.position.y + this.table.size.y / 2,
      clamp(
        context.intendedLanding.z,
        this.table.position.z - halfDepth,
        this.table.position.z + halfDepth,
      ),
    );

    const semanticCandidate = this.findSemanticCandidate(item, context, captureTarget);
    if (semanticCandidate !== null) {
      return semanticCandidate;
    }

    const target = this.findFreeTableTarget(
      captureTarget,
      item,
      context.worldRoot,
      halfWidth,
      halfDepth,
    );
    if (target === null) {
      return null;
    }

    return {
      id: this.id,
      priority: THROW_RECEIVER_PRIORITY.table,
      assistRadius: this.assistRadius,
      targetPosition: target,
      reserve: () => this.reserve(item, target),
    };
  }

  private reserve(
    item: PickableItem,
    target: Readonly<Vector3Like>,
  ): ThrowReceiverReservation | null {
    if (this.reservedPositions.has(item)) {
      return null;
    }
    const reservedTarget = new Vector3(target.x, target.y, target.z);
    this.reservedPositions.set(item, reservedTarget);
    let active = true;
    const release = (): void => {
      if (active) {
        this.reservedPositions.delete(item);
        active = false;
      }
    };
    return {
      targetPosition: reservedTarget,
      complete: (landedItem, worldRoot) => {
        release();
        landedItem.placeOnFloor(worldRoot, reservedTarget);
        return null;
      },
      cancel: release,
    };
  }

  private findSemanticCandidate(
    item: PickableItem,
    context: ThrowAssistContext,
    captureTarget: Readonly<Vector3>,
  ): ThrowReceiverCandidate | null {
    const candidates = this.semanticPlacePoints
      .map((placePoint) => placePoint.getThrowReceiverCandidate(item, context))
      .filter((candidate): candidate is ThrowReceiverCandidate => candidate !== null)
      .sort((left, right) => {
        const leftDistance = planarDistanceSquared(left.targetPosition, captureTarget);
        const rightDistance = planarDistanceSquared(right.targetPosition, captureTarget);
        return leftDistance - rightDistance || compareIds(left.id, right.id);
      });
    const candidate = candidates[0];
    if (candidate === undefined) {
      return null;
    }

    return {
      id: `${this.id}:${candidate.id}`,
      priority: candidate.priority,
      assistRadius: this.assistRadius,
      // Selection uses the table capture point; the reservation still lands at the canonical anchor.
      targetPosition: captureTarget,
      reserve: candidate.reserve,
    };
  }

  private findFreeTableTarget(
    preferred: Readonly<Vector3>,
    item: PickableItem,
    worldRoot: Object3D,
    halfWidth: number,
    halfDepth: number,
  ): Vector3 | null {
    if (this.isPositionFree(preferred, item, worldRoot)) {
      return preferred.clone();
    }

    const topY = this.table.position.y + this.table.size.y / 2;
    const candidates: Vector3[] = [];
    for (const xFactor of [-1, -0.5, 0, 0.5, 1]) {
      for (const zFactor of [-1, 0, 1]) {
        candidates.push(new Vector3(
          this.table.position.x + halfWidth * xFactor,
          topY,
          this.table.position.z + halfDepth * zFactor,
        ));
      }
    }
    candidates.sort((left, right) => (
      planarDistanceSquared(left, preferred) - planarDistanceSquared(right, preferred)
      || left.x - right.x
      || left.z - right.z
    ));
    return candidates.find((candidate) => this.isPositionFree(candidate, item, worldRoot)) ?? null;
  }

  private isPositionFree(
    target: Readonly<Vector3Like>,
    item: PickableItem,
    worldRoot: Object3D,
  ): boolean {
    const otherPosition = new Vector3();
    for (const other of this.allItems) {
      if (other === item || !other.isActive || other.isThrown) {
        continue;
      }
      other.object.getWorldPosition(otherPosition);
      worldRoot.worldToLocal(otherPosition);
      if (this.overlaps(target, item, otherPosition, other.footprintRadius)) {
        return false;
      }
    }
    for (const [reservedItem, reservedPosition] of this.reservedPositions) {
      if (
        reservedItem !== item
        && this.overlaps(target, item, reservedPosition, reservedItem.footprintRadius)
      ) {
        return false;
      }
    }
    return true;
  }

  private overlaps(
    target: Readonly<Vector3Like>,
    item: PickableItem,
    otherPosition: Readonly<Vector3Like>,
    otherRadius: number,
  ): boolean {
    const minimumDistance = item.footprintRadius + otherRadius + this.landingSpacing;
    return (
      (target.x - otherPosition.x) ** 2
      + (target.z - otherPosition.z) ** 2
    ) < minimumDistance ** 2;
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function planarDistanceSquared(
  left: Readonly<Vector3Like>,
  right: Readonly<Vector3Like>,
): number {
  return (left.x - right.x) ** 2 + (left.z - right.z) ** 2;
}

function compareIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
