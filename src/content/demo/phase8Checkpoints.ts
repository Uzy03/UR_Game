import type { CheckpointDefinition } from '../../save/CheckpointTypes';
import { PHASE7_CHECKPOINTS } from './phase7Checkpoints';
import {
  PHASE8_COMPLETE_CHECKPOINT_ID,
  PHASE8_INITIAL_CHECKPOINT_ID,
  PHASE8_PROMENADE_SCENE_ID,
} from './phase8Ids';
import { PHASE8_PROMENADE_PHOTO_ID } from './phase8PhoneContent';
import {
  PHASE8_COMPLETE_RESUME_SEQUENCE,
  PHASE8_MAIN_SEQUENCE,
} from './phase8Sequence';

const PHASE8_NEW_CHECKPOINTS = [
  {
    id: PHASE8_INITIAL_CHECKPOINT_ID,
    sceneId: PHASE8_PROMENADE_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: null,
      currentObjective: null,
      unlockedMessageIds: [],
      unlockedPhotoIds: [],
    },
    resumeSequence: PHASE8_MAIN_SEQUENCE,
  },
  {
    id: PHASE8_COMPLETE_CHECKPOINT_ID,
    sceneId: PHASE8_PROMENADE_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: '2026-05-03',
      currentObjective: null,
      unlockedMessageIds: [],
      unlockedPhotoIds: [PHASE8_PROMENADE_PHOTO_ID],
    },
    resumeSequence: PHASE8_COMPLETE_RESUME_SEQUENCE,
  },
] as const satisfies readonly CheckpointDefinition[];

// Phase 6 and 7 IDs remain registered so previously valid local saves continue to load.
export const PHASE8_CHECKPOINTS = [
  ...PHASE7_CHECKPOINTS,
  ...PHASE8_NEW_CHECKPOINTS,
] as const satisfies readonly CheckpointDefinition[];
