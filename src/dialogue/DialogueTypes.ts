export interface DialogueLine {
  readonly speaker: string;
  readonly text: string;
}

export interface DialogueSequence {
  readonly id: string;
  readonly lines: readonly DialogueLine[];
}
