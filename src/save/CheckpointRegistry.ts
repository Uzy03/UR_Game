import type { AudioContentRegistry } from '../audio/AudioContentRegistry';
import { assertValidAudioCue } from '../audio/AudioCueValidation';
import type { EventSequence, GameEvent } from '../events/EventTypes';
import { assertValidTransitionCardDefinition } from '../events/TransitionCardValidation';
import type { PhoneContentRegistry } from '../phone/PhoneContentRegistry';
import {
  isValidPhoneObjective,
  isValidStoryDate,
  parsePhoneProgressSnapshot,
} from '../phone/PhoneProgressValidation';
import type { SceneContentRegistry } from '../scene/SceneContentRegistry';
import type { Vector3Config } from '../stage/StageTypes';
import type { CheckpointDefinition } from './CheckpointTypes';

export class CheckpointRegistry {
  private readonly checkpoints = new Map<string, CheckpointDefinition>();

  public constructor(
    definitions: readonly CheckpointDefinition[],
    private readonly scenes: SceneContentRegistry,
    private readonly phoneContent: PhoneContentRegistry,
    private readonly audioContent: AudioContentRegistry,
  ) {
    for (const definition of definitions) {
      this.validateDefinition(definition);
      if (this.checkpoints.has(definition.id)) {
        throw new Error(`Duplicate Checkpoint ID "${definition.id}".`);
      }
      this.checkpoints.set(definition.id, definition);
    }

    for (const definition of definitions) {
      if (definition.resumeSequence !== null) {
        this.validateSequence(definition.id, definition.resumeSequence);
      }
    }
  }

  public getCheckpoint(checkpointId: string): CheckpointDefinition | undefined {
    return this.checkpoints.get(checkpointId);
  }

  private validateDefinition(definition: CheckpointDefinition): void {
    this.assertId(definition.id, 'Checkpoint');
    if (this.scenes.getScene(definition.sceneId) === undefined) {
      throw new Error(
        `Checkpoint "${definition.id}" references unknown Scene "${definition.sceneId}".`,
      );
    }
    if (parsePhoneProgressSnapshot(definition.phoneProgress, this.phoneContent, 'reject') === null) {
      throw new Error(`Checkpoint "${definition.id}" has invalid Phone progress.`);
    }
  }

  private validateSequence(checkpointId: string, sequence: EventSequence): void {
    this.assertId(sequence.id, `Checkpoint "${checkpointId}" resume sequence`);
    if (!Array.isArray(sequence.events)) {
      throw new Error(`Checkpoint "${checkpointId}" resume sequence events must be an array.`);
    }

    for (const [index, event] of sequence.events.entries()) {
      this.validateEvent(checkpointId, index, event);
    }
  }

  private validateEvent(checkpointId: string, index: number, event: GameEvent): void {
    const label = `Checkpoint "${checkpointId}" resume event ${index}`;
    switch (event.type) {
      case 'dialogue':
        this.assertId(event.sequence.id, `${label} dialogue sequence`);
        if (!Array.isArray(event.sequence.lines)) {
          throw new Error(`${label} dialogue lines must be an array.`);
        }
        for (const [lineIndex, line] of event.sequence.lines.entries()) {
          this.assertNonEmpty(line.speaker, `${label} dialogue line ${lineIndex} speaker`);
          this.assertNonEmpty(line.text, `${label} dialogue line ${lineIndex} text`);
        }
        break;
      case 'move_npc':
        this.assertId(event.npcId, `${label} NPC`);
        this.assertVector(event.position, `${label} position`);
        break;
      case 'task':
        this.assertId(event.taskId, `${label} Task`);
        break;
      case 'speech':
        this.assertId(event.npcId, `${label} NPC`);
        this.assertNonEmpty(event.text, `${label} speech text`);
        this.assertNonNegative(event.durationSeconds, `${label} speech duration`);
        break;
      case 'wait':
        this.assertNonNegative(event.durationSeconds, `${label} wait duration`);
        break;
      case 'set_date':
        if (!isValidStoryDate(event.date)) {
          throw new Error(`${label} has an invalid story date "${String(event.date)}".`);
        }
        break;
      case 'set_objective':
        if (!isValidPhoneObjective(event.objective)) {
          throw new Error(`${label} has an invalid Phone objective.`);
        }
        break;
      case 'unlock_message':
        if (this.phoneContent.getMessage(event.messageId) === undefined) {
          throw new Error(`${label} references unknown Phone message "${event.messageId}".`);
        }
        break;
      case 'unlock_photo':
        if (this.phoneContent.getPhoto(event.photoId) === undefined) {
          throw new Error(`${label} references unknown Phone photo "${event.photoId}".`);
        }
        break;
      case 'change_scene':
        if (this.scenes.getScene(event.sceneId) === undefined) {
          throw new Error(`${label} references unknown Scene "${event.sceneId}".`);
        }
        break;
      case 'set_checkpoint':
        if (!this.checkpoints.has(event.checkpointId)) {
          throw new Error(`${label} references unknown Checkpoint "${event.checkpointId}".`);
        }
        break;
      case 'phone_story':
        this.assertId(event.card.id, `${label} Phone Story card`);
        this.assertNonEmpty(event.card.appLabel, `${label} Phone Story app label`);
        this.assertNonEmpty(event.card.title, `${label} Phone Story title`);
        this.assertNonEmpty(event.card.body, `${label} Phone Story body`);
        this.assertNonEmpty(event.card.actionLabel, `${label} Phone Story action label`);
        if (
          event.card.subtitle !== undefined
          && typeof event.card.subtitle !== 'string'
        ) {
          throw new Error(`${label} Phone Story subtitle must be a string when provided.`);
        }
        break;
      case 'transition_card':
        assertValidTransitionCardDefinition(event.card, `${label} Transition Card`);
        break;
      case 'audio_cue':
        assertValidAudioCue(event.cue, this.audioContent, `${label} Audio Cue`);
        break;
      default: {
        const unsupported = event as { readonly type?: unknown };
        throw new Error(`${label} has unsupported type "${String(unsupported.type)}".`);
      }
    }
  }

  private assertId(value: string, label: string): void {
    this.assertNonEmpty(value, `${label} ID`);
  }

  private assertNonEmpty(value: string, label: string): void {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`${label} must be a non-empty string.`);
    }
  }

  private assertVector(value: Vector3Config, label: string): void {
    if (!Number.isFinite(value.x) || !Number.isFinite(value.y) || !Number.isFinite(value.z)) {
      throw new Error(`${label} must contain finite coordinates.`);
    }
  }

  private assertNonNegative(value: number, label: string): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${label} must be a finite non-negative number.`);
    }
  }
}
