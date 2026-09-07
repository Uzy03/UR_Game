import type { DialogueUI } from '../ui/DialogueUI';
import type { DialogueSequence } from './DialogueTypes';

export class DialogueManager {
  private sequence: DialogueSequence | null = null;
  private lineIndex = 0;
  private completionHandler: (() => void) | null = null;

  public constructor(private readonly ui: DialogueUI) {}

  public get isActive(): boolean {
    return this.sequence !== null;
  }

  public start(sequence: DialogueSequence, onComplete?: () => void): void {
    this.close();
    if (sequence.lines.length === 0) {
      onComplete?.();
      return;
    }

    this.sequence = sequence;
    this.lineIndex = 0;
    this.completionHandler = onComplete ?? null;
    this.ui.show(sequence.lines[0]);
  }

  public update(advanceRequested: boolean): void {
    if (!advanceRequested || this.sequence === null) {
      return;
    }

    const nextIndex = this.lineIndex + 1;
    if (nextIndex < this.sequence.lines.length) {
      this.lineIndex = nextIndex;
      this.ui.show(this.sequence.lines[this.lineIndex]);
      return;
    }

    const completionHandler = this.completionHandler;
    this.close();
    completionHandler?.();
  }

  public close(): void {
    this.sequence = null;
    this.lineIndex = 0;
    this.completionHandler = null;
    this.ui.hide();
  }
}
