import type { CheckpointDefinition } from '../../save/CheckpointTypes';
import {
  PHASE4_DEMO_MESSAGE_ID,
  PHASE4_DEMO_PHOTO_ID,
} from './phase4PhoneContent';
import { PHASE5_DEMO_SEQUENCE } from './phase5DemoSequence';
import {
  PHASE5_GARDEN_SCENE_ID,
  PHASE5_INITIAL_SCENE_ID,
} from './phase5Scenes';
import {
  PHASE6_AFTER_DELIVERY_CHECKPOINT_ID,
  PHASE6_INITIAL_CHECKPOINT_ID,
} from './phase6CheckpointIds';
import { PHASE6_GARDEN_RESUME_SEQUENCE } from './phase6ResumeSequence';

export const PHASE6_CHECKPOINTS = [
  {
    id: PHASE6_INITIAL_CHECKPOINT_ID,
    sceneId: PHASE5_INITIAL_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: null,
      currentObjective: null,
      unlockedMessageIds: [],
      unlockedPhotoIds: [],
    },
    resumeSequence: PHASE5_DEMO_SEQUENCE,
  },
  {
    id: PHASE6_AFTER_DELIVERY_CHECKPOINT_ID,
    sceneId: PHASE5_GARDEN_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: '2026-02-14',
      currentObjective: null,
      unlockedMessageIds: [PHASE4_DEMO_MESSAGE_ID],
      unlockedPhotoIds: [PHASE4_DEMO_PHOTO_ID],
    },
    resumeSequence: PHASE6_GARDEN_RESUME_SEQUENCE,
  },
] as const satisfies readonly CheckpointDefinition[];
