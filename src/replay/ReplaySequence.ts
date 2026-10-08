import type { EventSequence, GameEvent } from '../events/EventTypes';

export function isReplayEvent(event: GameEvent): boolean {
  switch (event.type) {
    case 'audio_cue': case 'transition_card': case 'change_scene': case 'dialogue':
    case 'task': case 'move_npc': case 'speech': case 'wait': case 'phone_story':
      return true;
    case 'set_date': case 'set_objective': case 'unlock_message': case 'unlock_photo':
    case 'set_checkpoint': case 'world_map':
      return false;
    default:
      throw new Error('Unsupported Replay event.');
  }
}

export function projectReplaySequence(source: EventSequence): EventSequence {
  if (!source.id.trim() || !Array.isArray(source.events)) {
    throw new Error('Invalid route entry sequence.');
  }
  const events = source.events.filter(isReplayEvent);
  if (!events.some((event) => event.type === 'change_scene')) {
    throw new Error('Replay has no stage scene.');
  }
  return { id: `${source.id}:replay`, events };
}

// Canonical resume uses its original sequence, but may only present runtime state.
export function assertRuntimeOnlyResume(sequence: EventSequence | null): void {
  if (sequence?.events.some((event) => !isReplayEvent(event)
    && !(event.type === 'world_map' && event.action === 'show'))) {
    throw new Error('Saved checkpoint resume would change campaign progress.');
  }
}
