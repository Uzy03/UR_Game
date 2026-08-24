import type { Vector3Config } from '../config/gameConfig';
import type { DialogueSequence } from '../dialogue/DialogueTypes';
import type { PhoneObjective } from '../phone/PhoneTypes';

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

export interface SetDateEvent {
  readonly type: 'set_date';
  readonly date: string;
}

export interface SetObjectiveEvent {
  readonly type: 'set_objective';
  readonly objective: PhoneObjective | null;
}

export interface UnlockMessageEvent {
  readonly type: 'unlock_message';
  readonly messageId: string;
}

export interface UnlockPhotoEvent {
  readonly type: 'unlock_photo';
  readonly photoId: string;
}

export type GameEvent =
  | DialogueEvent
  | MoveNpcEvent
  | TaskEvent
  | SpeechEvent
  | WaitEvent
  | SetDateEvent
  | SetObjectiveEvent
  | UnlockMessageEvent
  | UnlockPhotoEvent;

export interface EventSequence {
  readonly id: string;
  readonly events: readonly GameEvent[];
}
