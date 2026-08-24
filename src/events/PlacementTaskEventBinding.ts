import type { Vector3Like } from 'three';
import type { CarrySystem } from '../interaction/CarrySystem';
import type { InteractionSystem } from '../interaction/InteractionSystem';
import type { PickableItem } from '../interaction/PickableItem';
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
}

export class PlacementTaskEventBinding implements TaskEventBinding {
  public readonly task: Task;

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
    carry.reset();
    for (const placePoint of placePoints) {
      placePoint.reset();
    }
    for (const item of items) {
      item.reset();
    }
    player.reset(playerStartPosition, playerStartFacing);
    resultOverlay.hide();
    speechBubble.hide();
  }
}
