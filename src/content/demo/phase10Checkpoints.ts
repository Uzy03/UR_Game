import type { CheckpointDefinition } from '../../save/CheckpointTypes';
import { PHASE9_CHECKPOINTS } from './phase9Checkpoints';
import {
  PHASE10_ASSEMBLY_SCENE_ID,
  PHASE10_COMPLETE_CHECKPOINT_ID,
  PHASE10_COMPLETE_SCENE_ID,
  PHASE10_INITIAL_CHECKPOINT_ID,
} from './phase10Ids';
import { PHASE10_ASSEMBLY_PHOTO_ID } from './phase10PhoneContent';
import {
  PHASE10_COMPLETE_RESUME_SEQUENCE,
  PHASE10_MAIN_SEQUENCE,
} from './phase10Sequence';

const PHASE10_NEW_CHECKPOINTS = [
  {
    id: PHASE10_INITIAL_CHECKPOINT_ID,
    sceneId: PHASE10_ASSEMBLY_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: null,
      currentObjective: null,
      unlockedMessageIds: [],
      unlockedPhotoIds: [],
    },
    resumeSequence: PHASE10_MAIN_SEQUENCE,
  },
  {
    id: PHASE10_COMPLETE_CHECKPOINT_ID,
    sceneId: PHASE10_COMPLETE_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: '2026-07-05',
      currentObjective: null,
      unlockedMessageIds: [],
      unlockedPhotoIds: [PHASE10_ASSEMBLY_PHOTO_ID],
    },
    resumeSequence: PHASE10_COMPLETE_RESUME_SEQUENCE,
  },
] as const satisfies readonly CheckpointDefinition[];

// Phase 6-9 IDs stay registered for local-save compatibility.
export const PHASE10_CHECKPOINTS = [
  ...PHASE9_CHECKPOINTS,
  ...PHASE10_NEW_CHECKPOINTS,
] as const satisfies readonly CheckpointDefinition[];
