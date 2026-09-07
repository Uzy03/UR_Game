import type { InteractionSystem } from '../interaction/InteractionSystem';
import type { Task } from '../task/Task';
import type { ResultOverlay } from '../ui/ResultOverlay';
import type { SpeechBubble } from '../ui/SpeechBubble';
import type { TaskEventBinding } from './TaskEventBinding';

interface ReachZoneTaskEventBindingOptions {
  readonly task: Task;
  readonly interaction: InteractionSystem;
  readonly resultOverlay: ResultOverlay;
  readonly speechBubble: SpeechBubble;
}

export class ReachZoneTaskEventBinding implements TaskEventBinding {
  public readonly task: Task;

  public constructor(private readonly options: ReachZoneTaskEventBindingOptions) {
    this.task = options.task;
  }

  public prepareAttempt(): void {
    this.options.interaction.reset();
    this.options.resultOverlay.hide();
    this.options.speechBubble.hide();
  }
}
