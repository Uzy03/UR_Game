import type { Vector3Config } from '../config/gameConfig';
import type { AudioCue } from '../audio/AudioTypes';
import type { DialogueSequence } from '../dialogue/DialogueTypes';
import type { PhoneObjective, PhoneStoryCard } from '../phone/PhoneTypes';

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

export interface ChangeSceneEvent {
  readonly type: 'change_scene';
  readonly sceneId: string;
}

export interface SetCheckpointEvent {
  readonly type: 'set_checkpoint';
  readonly checkpointId: string;
}

export interface PhoneStoryEvent {
  readonly type: 'phone_story';
  readonly card: PhoneStoryCard;
}

export interface TransitionCardDefinition {
  readonly id: string;
  readonly eyebrow?: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly durationSeconds: number;
}

export interface TransitionCardEvent {
  readonly type: 'transition_card';
  readonly card: TransitionCardDefinition;
}

export interface AudioCueEvent {
  readonly type: 'audio_cue';
  readonly cue: AudioCue;
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
  | UnlockPhotoEvent
  | ChangeSceneEvent
  | SetCheckpointEvent
  | PhoneStoryEvent
  | TransitionCardEvent
  | AudioCueEvent;

export interface EventSequence {
  readonly id: string;
  readonly events: readonly GameEvent[];
}
