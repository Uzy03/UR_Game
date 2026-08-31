import type { CheckpointDefinition } from '../../save/CheckpointTypes';
import type { CampaignStoryDefinition } from './CampaignStoryTypes';
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
import type { CampaignSequences } from './campaignSequences';

export function createCampaignCheckpoints(
  story: CampaignStoryDefinition,
  sequences: CampaignSequences,
): readonly CheckpointDefinition[] {
  return [
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
    resumeSequence: sequences.main,
  },
  {
    id: CAMPAIGN_AFTER_MEETING_CHECKPOINT_ID,
    sceneId: CAMPAIGN_CAFE_COMPLETE_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: story.meeting.date,
      currentObjective: null,
      unlockedMessageIds: [CAMPAIGN_INVITATION_MESSAGE_ID],
      unlockedPhotoIds: [CAMPAIGN_MEETING_PHOTO_ID],
    },
    resumeSequence: sequences.afterMeeting,
  },
  {
    id: CAMPAIGN_AFTER_OUTING_CHECKPOINT_ID,
    sceneId: CAMPAIGN_PARK_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: story.outing.date,
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
    resumeSequence: sequences.afterOuting,
  },
  {
    id: CAMPAIGN_AFTER_PREPARATION_CHECKPOINT_ID,
    sceneId: CAMPAIGN_PREP_COMPLETE_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: story.preparation.date,
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
    resumeSequence: sequences.afterPreparation,
  },
  {
    id: CAMPAIGN_BEFORE_ENDING_CHECKPOINT_ID,
    sceneId: CAMPAIGN_VIEWPOINT_COMPLETE_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: story.journey.date,
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
    resumeSequence: sequences.beforeEnding,
  },
  {
    id: CAMPAIGN_COMPLETE_CHECKPOINT_ID,
    sceneId: CAMPAIGN_ENDING_SCENE_ID,
    phoneProgress: {
      version: 1,
      storyDate: story.ending.date,
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
    resumeSequence: sequences.complete,
  },
  ] satisfies readonly CheckpointDefinition[];
}
