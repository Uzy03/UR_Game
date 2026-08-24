import type { PhoneContentDefinition } from '../../phone/PhoneTypes';

export const PHASE4_PHONE_CONTENT = {
  threads: [
    {
      id: 'demo-helper-thread',
      title: 'Helper',
    },
  ],
  messages: [
    {
      id: 'demo-message-1',
      threadId: 'demo-helper-thread',
      sender: 'Helper',
      text: 'Thanks for helping today!',
      timeLabel: '18:30',
    },
  ],
  photos: [
    {
      id: 'demo-photo-1',
      src: '/demo/demo-photo-1.svg',
      alt: 'A colorful illustrated landscape used as a demo memory',
      caption: 'A demo memory',
      date: '2026-01-01',
    },
  ],
} as const satisfies PhoneContentDefinition;
