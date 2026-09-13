import { Vector3, type Object3D, type Vector3Like } from 'three';
import type { StageObstacleDefinition } from '../stage/StageTypes';
import type { PickableItem } from './PickableItem';
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

    const target = new Vector3(
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
    if (!this.isPositionFree(target, item, context.worldRoot)) {
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
