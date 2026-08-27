import type { PhoneContentDefinition } from '../../phone/PhoneTypes';

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

export const CAMPAIGN_PHONE_CONTENT = {
  threads: [
    {
      id: CAMPAIGN_THREAD_ID,
      title: 'Demo Companion',
    },
  ],
  messages: [
    {
      id: CAMPAIGN_INVITATION_MESSAGE_ID,
      threadId: CAMPAIGN_THREAD_ID,
      sender: 'Demo Companion',
      text: 'This is a fictional invitation to Lantern Cafe.',
      timeLabel: '09:10',
    },
    {
      id: CAMPAIGN_OUTING_MESSAGE_ID,
      threadId: CAMPAIGN_THREAD_ID,
      sender: 'Demo Companion',
      text: 'The imaginary park route was a bright little detour.',
      timeLabel: '14:25',
    },
    {
      id: CAMPAIGN_PREPARATION_MESSAGE_ID,
      threadId: CAMPAIGN_THREAD_ID,
      sender: 'Demo Companion',
      text: 'Our placeholder picnic pieces are ready for the next stop.',
      timeLabel: '16:40',
    },
    {
      id: CAMPAIGN_ENDING_MESSAGE_ID,
      threadId: CAMPAIGN_THREAD_ID,
      sender: 'Demo Companion',
      text: 'Thanks for completing this entirely fictional campaign skeleton.',
      timeLabel: '20:15',
    },
  ],
  photos: [
    {
      id: CAMPAIGN_MEETING_PHOTO_ID,
      src: '/campaign/memory-01.svg',
      alt: 'A fictional illustration of two drinks at a cafe table',
      caption: 'Placeholder memory 1: Lantern Cafe',
      date: '2042-04-12',
    },
    {
      id: CAMPAIGN_OUTING_PHOTO_ID,
      src: '/campaign/memory-02.svg',
      alt: 'A fictional illustration of a park fountain and two figures',
      caption: 'Placeholder memory 2: Demo Park',
      date: '2042-05-03',
    },
    {
      id: CAMPAIGN_PREPARATION_PHOTO_ID,
      src: '/campaign/memory-03.svg',
      alt: 'A fictional illustration of prepared picnic items',
      caption: 'Placeholder memory 3: Preparation Space',
      date: '2042-06-14',
    },
    {
      id: CAMPAIGN_VIEWPOINT_PHOTO_ID,
      src: '/campaign/memory-04.svg',
      alt: 'A fictional illustration of a blue bundle at a viewpoint',
      caption: 'Placeholder memory 4: Demo Viewpoint',
      date: '2042-07-05',
    },
    {
      id: CAMPAIGN_ENDING_PHOTO_ID,
      src: '/campaign/ending.svg',
      alt: 'A fictional illustration of five collected campaign memories',
      caption: 'Placeholder finale: Campaign complete',
      date: '2042-08-09',
    },
  ],
} as const satisfies PhoneContentDefinition;
