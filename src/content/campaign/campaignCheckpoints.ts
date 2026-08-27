import type { CheckpointDefinition } from '../../save/CheckpointTypes';
import {
  CAMPAIGN_AFTER_MEETING_CHECKPOINT_ID,
  CAMPAIGN_AFTER_OUTING_CHECKPOINT_ID,
  CAMPAIGN_AFTER_PREPARATION_CHECKPOINT_ID,
  CAMPAIGN_BEDROOM_SCENE_ID,
  CAMPAIGN_BEFORE_ENDING_CHECKPOINT_ID,
  CAMPAIGN_CAFE_COMPLETE_SCENE_ID,
  CAMPAIGN_COMPLETE_CHECKPOINT_ID,
  CAMPAIGN_ENDING_SCENE_ID,
  CAMPAIGN_INITIAL_CHECKPOINT_ID,
  CAMPAIGN_PARK_SCENE_ID,
  CAMPAIGN_PREP_COMPLETE_SCENE_ID,
  CAMPAIGN_VIEWPOINT_COMPLETE_SCENE_ID,
} from './campaignIds';
import {
  CAMPAIGN_ENDING_MESSAGE_ID,
  CAMPAIGN_ENDING_PHOTO_ID,
  CAMPAIGN_INVITATION_MESSAGE_ID,
  CAMPAIGN_MEETING_PHOTO_ID,
  CAMPAIGN_OUTING_MESSAGE_ID,
  CAMPAIGN_OUTING_PHOTO_ID,
  CAMPAIGN_PREPARATION_MESSAGE_ID,
  CAMPAIGN_PREPARATION_PHOTO_ID,
  CAMPAIGN_VIEWPOINT_PHOTO_ID,
} from './campaignPhoneContent';
import {
  CAMPAIGN_AFTER_MEETING_RESUME_SEQUENCE,
  CAMPAIGN_AFTER_OUTING_RESUME_SEQUENCE,
  CAMPAIGN_AFTER_PREPARATION_RESUME_SEQUENCE,
  CAMPAIGN_BEFORE_ENDING_RESUME_SEQUENCE,
  CAMPAIGN_COMPLETE_RESUME_SEQUENCE,
  CAMPAIGN_MAIN_SEQUENCE,
} from './campaignSequences';

export const CAMPAIGN_CHECKPOINTS = [
  {
    id: CAMPAIGN_INITIAL_CHECKPOINT_ID,
    sceneId: CAMPAIGN_BEDROOM_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: null,
      currentObjective: null,
      unlockedMessageIds: [],
      unlockedPhotoIds: [],
    },
    resumeSequence: CAMPAIGN_MAIN_SEQUENCE,
  },
  {
    id: CAMPAIGN_AFTER_MEETING_CHECKPOINT_ID,
    sceneId: CAMPAIGN_CAFE_COMPLETE_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: '2042-04-12',
      currentObjective: null,
      unlockedMessageIds: [CAMPAIGN_INVITATION_MESSAGE_ID],
      unlockedPhotoIds: [CAMPAIGN_MEETING_PHOTO_ID],
    },
    resumeSequence: CAMPAIGN_AFTER_MEETING_RESUME_SEQUENCE,
  },
  {
    id: CAMPAIGN_AFTER_OUTING_CHECKPOINT_ID,
    sceneId: CAMPAIGN_PARK_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: '2042-05-03',
      currentObjective: null,
      unlockedMessageIds: [
        CAMPAIGN_INVITATION_MESSAGE_ID,
        CAMPAIGN_OUTING_MESSAGE_ID,
      ],
      unlockedPhotoIds: [
        CAMPAIGN_MEETING_PHOTO_ID,
        CAMPAIGN_OUTING_PHOTO_ID,
      ],
    },
    resumeSequence: CAMPAIGN_AFTER_OUTING_RESUME_SEQUENCE,
  },
  {
    id: CAMPAIGN_AFTER_PREPARATION_CHECKPOINT_ID,
    sceneId: CAMPAIGN_PREP_COMPLETE_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: '2042-06-14',
      currentObjective: null,
      unlockedMessageIds: [
        CAMPAIGN_INVITATION_MESSAGE_ID,
        CAMPAIGN_OUTING_MESSAGE_ID,
        CAMPAIGN_PREPARATION_MESSAGE_ID,
      ],
      unlockedPhotoIds: [
        CAMPAIGN_MEETING_PHOTO_ID,
        CAMPAIGN_OUTING_PHOTO_ID,
        CAMPAIGN_PREPARATION_PHOTO_ID,
      ],
    },
    resumeSequence: CAMPAIGN_AFTER_PREPARATION_RESUME_SEQUENCE,
  },
  {
    id: CAMPAIGN_BEFORE_ENDING_CHECKPOINT_ID,
    sceneId: CAMPAIGN_VIEWPOINT_COMPLETE_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: '2042-07-05',
      currentObjective: null,
      unlockedMessageIds: [
        CAMPAIGN_INVITATION_MESSAGE_ID,
        CAMPAIGN_OUTING_MESSAGE_ID,
        CAMPAIGN_PREPARATION_MESSAGE_ID,
      ],
      unlockedPhotoIds: [
        CAMPAIGN_MEETING_PHOTO_ID,
        CAMPAIGN_OUTING_PHOTO_ID,
        CAMPAIGN_PREPARATION_PHOTO_ID,
        CAMPAIGN_VIEWPOINT_PHOTO_ID,
      ],
    },
    resumeSequence: CAMPAIGN_BEFORE_ENDING_RESUME_SEQUENCE,
  },
  {
    id: CAMPAIGN_COMPLETE_CHECKPOINT_ID,
    sceneId: CAMPAIGN_ENDING_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: '2042-08-09',
      currentObjective: null,
      unlockedMessageIds: [
        CAMPAIGN_INVITATION_MESSAGE_ID,
        CAMPAIGN_OUTING_MESSAGE_ID,
        CAMPAIGN_PREPARATION_MESSAGE_ID,
        CAMPAIGN_ENDING_MESSAGE_ID,
      ],
      unlockedPhotoIds: [
        CAMPAIGN_MEETING_PHOTO_ID,
        CAMPAIGN_OUTING_PHOTO_ID,
        CAMPAIGN_PREPARATION_PHOTO_ID,
        CAMPAIGN_VIEWPOINT_PHOTO_ID,
        CAMPAIGN_ENDING_PHOTO_ID,
      ],
    },
    resumeSequence: CAMPAIGN_COMPLETE_RESUME_SEQUENCE,
  },
] as const satisfies readonly CheckpointDefinition[];
