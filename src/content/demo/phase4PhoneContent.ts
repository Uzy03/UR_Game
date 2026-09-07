import type { PhoneContentDefinition } from '../../phone/PhoneTypes';

export const PHASE4_DEMO_MESSAGE_ID = 'demo-message-1';
export const PHASE4_DEMO_PHOTO_ID = 'demo-photo-1';

export const PHASE4_PHONE_CONTENT = {
  threads: [
    {
      id: 'demo-helper-thread',
      title: 'Helper',
    },
  ],
  messages: [
    {
      id: PHASE4_DEMO_MESSAGE_ID,
      threadId: 'demo-helper-thread',
      sender: 'Helper',
      text: 'Thanks for helping today!',
      timeLabel: '18:30',
    },
  ],
  photos: [
    {
      id: PHASE4_DEMO_PHOTO_ID,
      src: '/demo/demo-photo-1.svg',
      alt: 'A colorful illustrated landscape used as a demo memory',
      caption: 'A demo memory',
      date: '2026-01-01',
    },
  ],
} as const satisfies PhoneContentDefinition;
