import type { PhoneContentDefinition } from '../../phone/PhoneTypes';
import type { CampaignStoryDefinition } from './CampaignStoryTypes';

export const CAMPAIGN_THREAD_ID = 'campaign-demo-companion-thread';

export const CAMPAIGN_INVITATION_MESSAGE_ID = 'campaign-message-invitation';
export const CAMPAIGN_OUTING_MESSAGE_ID = 'campaign-message-outing';
export const CAMPAIGN_PREPARATION_MESSAGE_ID = 'campaign-message-preparation';
export const CAMPAIGN_ENDING_MESSAGE_ID = 'campaign-message-ending';

export const CAMPAIGN_MEETING_PHOTO_ID = 'campaign-photo-meeting';
export const CAMPAIGN_OUTING_PHOTO_ID = 'campaign-photo-outing';
export const CAMPAIGN_PREPARATION_PHOTO_ID = 'campaign-photo-preparation';
export const CAMPAIGN_VIEWPOINT_PHOTO_ID = 'campaign-photo-viewpoint';
export const CAMPAIGN_ENDING_PHOTO_ID = 'campaign-photo-ending';

export const CAMPAIGN_MESSAGE_IDS = [
  CAMPAIGN_INVITATION_MESSAGE_ID,
  CAMPAIGN_OUTING_MESSAGE_ID,
  CAMPAIGN_PREPARATION_MESSAGE_ID,
  CAMPAIGN_ENDING_MESSAGE_ID,
] as const;

export const CAMPAIGN_PHOTO_IDS = [
  CAMPAIGN_MEETING_PHOTO_ID,
  CAMPAIGN_OUTING_PHOTO_ID,
  CAMPAIGN_PREPARATION_PHOTO_ID,
  CAMPAIGN_VIEWPOINT_PHOTO_ID,
  CAMPAIGN_ENDING_PHOTO_ID,
] as const;

export function createCampaignPhoneContent(
  story: CampaignStoryDefinition,
): PhoneContentDefinition {
  return {
  threads: [
    {
      id: CAMPAIGN_THREAD_ID,
      title: story.phoneThreadTitle,
    },
  ],
  messages: [
    {
      id: CAMPAIGN_INVITATION_MESSAGE_ID,
      threadId: CAMPAIGN_THREAD_ID,
      ...story.prologue.invitationMessage,
    },
    {
      id: CAMPAIGN_OUTING_MESSAGE_ID,
      threadId: CAMPAIGN_THREAD_ID,
      ...story.outing.message,
    },
    {
      id: CAMPAIGN_PREPARATION_MESSAGE_ID,
      threadId: CAMPAIGN_THREAD_ID,
      ...story.preparation.message,
    },
    {
      id: CAMPAIGN_ENDING_MESSAGE_ID,
      threadId: CAMPAIGN_THREAD_ID,
      ...story.ending.message,
    },
  ],
  photos: [
    {
      id: CAMPAIGN_MEETING_PHOTO_ID,
      ...story.meeting.photo,
    },
    {
      id: CAMPAIGN_OUTING_PHOTO_ID,
      ...story.outing.photo,
    },
    {
      id: CAMPAIGN_PREPARATION_PHOTO_ID,
      ...story.preparation.photo,
    },
    {
      id: CAMPAIGN_VIEWPOINT_PHOTO_ID,
      ...story.journey.photo,
    },
    {
      id: CAMPAIGN_ENDING_PHOTO_ID,
      ...story.ending.photo,
    },
  ],
  } satisfies PhoneContentDefinition;
}
