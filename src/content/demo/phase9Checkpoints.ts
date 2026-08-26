import type { CheckpointDefinition } from '../../save/CheckpointTypes';
import { PHASE8_CHECKPOINTS } from './phase8Checkpoints';
import {
  PHASE9_COMPLETE_CHECKPOINT_ID,
  PHASE9_COMPLETE_SCENE_ID,
  PHASE9_INITIAL_CHECKPOINT_ID,
  PHASE9_PREP_SCENE_ID,
} from './phase9Ids';
import { PHASE9_PREP_PHOTO_ID } from './phase9PhoneContent';
import {
  PHASE9_COMPLETE_RESUME_SEQUENCE,
  PHASE9_MAIN_SEQUENCE,
} from './phase9Sequence';

const PHASE9_NEW_CHECKPOINTS = [
  {
    id: PHASE9_INITIAL_CHECKPOINT_ID,
    sceneId: PHASE9_PREP_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: null,
      currentObjective: null,
      unlockedMessageIds: [],
      unlockedPhotoIds: [],
    },
    resumeSequence: PHASE9_MAIN_SEQUENCE,
  },
  {
    id: PHASE9_COMPLETE_CHECKPOINT_ID,
    sceneId: PHASE9_COMPLETE_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: '2026-06-14',
      currentObjective: null,
      unlockedMessageIds: [],
      unlockedPhotoIds: [PHASE9_PREP_PHOTO_ID],
    },
    resumeSequence: PHASE9_COMPLETE_RESUME_SEQUENCE,
  },
] as const satisfies readonly CheckpointDefinition[];

// Phase 6-8 IDs stay registered for local-save compatibility.
export const PHASE9_CHECKPOINTS = [
  ...PHASE8_CHECKPOINTS,
  ...PHASE9_NEW_CHECKPOINTS,
] as const satisfies readonly CheckpointDefinition[];
