import type { CheckpointDefinition } from '../../save/CheckpointTypes';
import { PHASE6_CHECKPOINTS } from './phase6Checkpoints';
import {
  PHASE7_AFTER_MEETING_CHECKPOINT_ID,
  PHASE7_BEDROOM_SCENE_ID,
  PHASE7_CAFE_SCENE_ID,
  PHASE7_INITIAL_CHECKPOINT_ID,
} from './phase7Ids';
import {
  PHASE7_CAFE_PHOTO_ID,
  PHASE7_INVITATION_MESSAGE_ID,
  PHASE7_REPLY_MESSAGE_ID,
} from './phase7PhoneContent';
import {
  PHASE7_CAFE_RESUME_SEQUENCE,
  PHASE7_MAIN_SEQUENCE,
} from './phase7Sequence';

const PHASE7_NEW_CHECKPOINTS = [
  {
    id: PHASE7_INITIAL_CHECKPOINT_ID,
    sceneId: PHASE7_BEDROOM_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: null,
      currentObjective: null,
      unlockedMessageIds: [],
      unlockedPhotoIds: [],
    },
    resumeSequence: PHASE7_MAIN_SEQUENCE,
  },
  {
    id: PHASE7_AFTER_MEETING_CHECKPOINT_ID,
    sceneId: PHASE7_CAFE_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: '2026-04-12',
      currentObjective: null,
      unlockedMessageIds: [
        PHASE7_INVITATION_MESSAGE_ID,
        PHASE7_REPLY_MESSAGE_ID,
      ],
      unlockedPhotoIds: [PHASE7_CAFE_PHOTO_ID],
    },
    resumeSequence: PHASE7_CAFE_RESUME_SEQUENCE,
  },
] as const satisfies readonly CheckpointDefinition[];

// Keeping old definitions registered preserves valid local saves created by Phase 6.
export const PHASE7_CHECKPOINTS = [
  ...PHASE6_CHECKPOINTS,
  ...PHASE7_NEW_CHECKPOINTS,
] as const satisfies readonly CheckpointDefinition[];
