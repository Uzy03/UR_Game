import type { EventSequence } from '../events/EventTypes';
import type { PhoneProgressSnapshot } from '../phone/PhoneTypes';

export interface CheckpointDefinition {
  readonly id: string;
  readonly sceneId: string;
  readonly phoneProgress: PhoneProgressSnapshot;
  readonly resumeSequence: EventSequence | null;
}

export interface CheckpointActions {
  setCheckpoint(checkpointId: string): void;
}
