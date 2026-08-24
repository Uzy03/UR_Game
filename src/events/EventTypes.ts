import type { Vector3Config } from '../config/gameConfig';
import type { DialogueSequence } from '../dialogue/DialogueTypes';

export interface DialogueEvent {
  readonly type: 'dialogue';
  readonly sequence: DialogueSequence;
}

export interface MoveNpcEvent {
  readonly type: 'move_npc';
  readonly npcId: string;
  readonly position: Vector3Config;
}

export interface TaskEvent {
  readonly type: 'task';
  readonly taskId: string;
}

export interface SpeechEvent {
  readonly type: 'speech';
  readonly npcId: string;
  readonly text: string;
  readonly durationSeconds: number;
}

export interface WaitEvent {
  readonly type: 'wait';
  readonly durationSeconds: number;
}

export type GameEvent =
  | DialogueEvent
  | MoveNpcEvent
  | TaskEvent
  | SpeechEvent
  | WaitEvent;

export interface EventSequence {
  readonly id: string;
  readonly events: readonly GameEvent[];
}
