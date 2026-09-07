import type { PhoneContentDefinition } from '../../phone/PhoneTypes';
import { PHASE7_PHONE_CONTENT } from './phase7PhoneContent';

export const PHASE8_PROMENADE_PHOTO_ID = 'phase8-demo-promenade-photo';

export const PHASE8_PHONE_CONTENT = {
  threads: [...PHASE7_PHONE_CONTENT.threads],
  messages: [...PHASE7_PHONE_CONTENT.messages],
  photos: [
    ...PHASE7_PHONE_CONTENT.photos,
    {
      id: PHASE8_PROMENADE_PHOTO_ID,
      src: '/demo/phase8-promenade-placeholder.svg',
      alt: 'A fictional illustration of a fountain and a sunny promenade',
      caption: 'A fictional promenade memory',
      date: '2026-05-03',
    },
  ],
} as const satisfies PhoneContentDefinition;
