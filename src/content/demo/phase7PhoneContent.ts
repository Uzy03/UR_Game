import type { PhoneContentDefinition } from '../../phone/PhoneTypes';
import { PHASE4_PHONE_CONTENT } from './phase4PhoneContent';

export const PHASE7_INVITATION_MESSAGE_ID = 'phase7-demo-invitation';
export const PHASE7_REPLY_MESSAGE_ID = 'phase7-demo-reply';
export const PHASE7_CAFE_PHOTO_ID = 'phase7-demo-cafe-photo';

export const PHASE7_PHONE_CONTENT = {
  threads: [
    ...PHASE4_PHONE_CONTENT.threads,
    {
      id: 'phase7-demo-partner-thread',
      title: 'Demo Partner',
    },
  ],
  messages: [
    ...PHASE4_PHONE_CONTENT.messages,
    {
      id: PHASE7_INVITATION_MESSAGE_ID,
      threadId: 'phase7-demo-partner-thread',
      sender: 'Demo Partner',
      text: 'Would you like to meet for coffee at the demo cafe?',
      timeLabel: '10:15',
    },
    {
      id: PHASE7_REPLY_MESSAGE_ID,
      threadId: 'phase7-demo-partner-thread',
      sender: 'Player',
      text: 'Sure, sounds good! I will see you there.',
      timeLabel: '10:17',
    },
  ],
  photos: [
    ...PHASE4_PHONE_CONTENT.photos,
    {
      id: PHASE7_CAFE_PHOTO_ID,
      src: '/demo/phase7-cafe-placeholder.svg',
      alt: 'A fictional illustration of two drinks on a cafe table',
      caption: 'A fictional cafe memory',
      date: '2026-04-12',
    },
  ],
} as const satisfies PhoneContentDefinition;
