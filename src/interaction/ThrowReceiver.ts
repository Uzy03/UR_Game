import type { Object3D, Vector3, Vector3Like } from 'three';
import type { PickableItem } from './PickableItem';

export const THROW_RECEIVER_PRIORITY = {
  placePoint: 10,
  station: 20,
  npc: 30,
  table: 40,
} as const;

export interface ThrowAssistContext {
  readonly worldRoot: Object3D;
  readonly origin: Readonly<Vector3Like>;
  readonly direction: Readonly<Vector3Like>;
  readonly intendedLanding: Readonly<Vector3Like>;
  isFloorPositionValid(position: Readonly<Vector3Like>): boolean;
}

export interface ThrowReceiveTransition {
  update(deltaSeconds: number): boolean;
  cancel(): void;
}

export interface ThrowReceiverReservation {
  readonly targetPosition: Readonly<Vector3>;
  complete(item: PickableItem, worldRoot: Object3D): ThrowReceiveTransition | null;
  cancel(): void;
}

export interface ThrowReceiverCandidate {
  readonly id: string;
  readonly priority: number;
  readonly assistRadius: number;
  readonly targetPosition: Readonly<Vector3>;
  reserve(): ThrowReceiverReservation | null;
}

export interface ThrowReceiver {
  getThrowReceiverCandidate(
    item: PickableItem,
    context: ThrowAssistContext,
  ): ThrowReceiverCandidate | null;
}
