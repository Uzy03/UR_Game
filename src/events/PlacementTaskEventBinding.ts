import type { Object3D, Vector3Like } from 'three';
import type { CarrySystem } from '../interaction/CarrySystem';
import type { InteractionSystem } from '../interaction/InteractionSystem';
import type {
  PickableItem,
  PickableItemRuntimeState,
} from '../interaction/PickableItem';
import type { PlacePoint } from '../interaction/PlacePoint';
import type { PlayerController } from '../player/PlayerController';
import type { Task } from '../task/Task';
import type { ResultOverlay } from '../ui/ResultOverlay';
import type { SpeechBubble } from '../ui/SpeechBubble';
import type { TaskEventBinding } from './TaskEventBinding';

interface PlacementTaskEventBindingOptions {
  readonly task: Task;
  readonly carry: CarrySystem;
  readonly interaction: InteractionSystem;
  readonly items: readonly PickableItem[];
  readonly placePoints: readonly PlacePoint[];
  readonly player: PlayerController;
  readonly playerStartPosition: Readonly<Vector3Like>;
  readonly playerStartFacing: number;
  readonly resultOverlay: ResultOverlay;
  readonly speechBubble: SpeechBubble;
  readonly preserveWorldOnFirstAttempt?: boolean;
  readonly preserveItemProcessingOnRetry?: boolean;
  readonly preserveItemRuntimeOnRetry?: boolean;
  readonly worldRoot: Object3D;
  readonly resetBeforeItems?: () => void;
}

export class PlacementTaskEventBinding implements TaskEventBinding {
  public readonly task: Task;
  private hasPreparedAttempt = false;
  private itemAttemptStates: ReadonlyMap<PickableItem, PickableItemRuntimeState> | null = null;

  public constructor(private readonly options: PlacementTaskEventBindingOptions) {
    this.task = options.task;
  }

  public prepareAttempt(): void {
    const {
      carry,
      interaction,
      items,
      placePoints,
      player,
      playerStartFacing,
      playerStartPosition,
      resultOverlay,
      speechBubble,
    } = this.options;

    interaction.reset();
    const preserveCurrentWorld = (
      this.options.preserveWorldOnFirstAttempt === true
      && !this.hasPreparedAttempt
    );
    this.hasPreparedAttempt = true;

    if (preserveCurrentWorld) {
      this.captureItemAttemptStatesIfNeeded();
    } else if (
      this.options.preserveItemRuntimeOnRetry === true
      && this.itemAttemptStates !== null
    ) {
      carry.releaseForPlacement();
      this.options.resetBeforeItems?.();
      for (const placePoint of placePoints) {
        placePoint.reset();
      }
      for (const item of items) {
        const state = this.itemAttemptStates.get(item);
        if (state === undefined) {
          throw new Error(`Placement retry state for Item "${item.id}" is missing.`);
        }
        item.restoreRuntimeState(state);
        if (item.isActive && !item.isOnFloor()) {
          item.releaseToWorld(this.options.worldRoot);
        }
      }
      player.reset(playerStartPosition, playerStartFacing);
    } else {
      if (this.options.preserveItemProcessingOnRetry === true) {
        carry.releaseForPlacement();
      } else {
        carry.reset();
      }
      this.options.resetBeforeItems?.();
      for (const placePoint of placePoints) {
        placePoint.reset();
      }
      for (const item of items) {
        if (this.options.preserveItemProcessingOnRetry === true) {
          item.resetTransform();
        } else {
          item.reset();
        }
      }
      player.reset(playerStartPosition, playerStartFacing);
      this.captureItemAttemptStatesIfNeeded();
    }
    resultOverlay.hide();
    speechBubble.hide();
  }

  private captureItemAttemptStatesIfNeeded(): void {
    if (
      this.options.preserveItemRuntimeOnRetry !== true
      || this.itemAttemptStates !== null
    ) {
      return;
    }

    this.itemAttemptStates = new Map(
      this.options.items.map((item) => [item, item.captureRuntimeState()] as const),
    );
  }
}
