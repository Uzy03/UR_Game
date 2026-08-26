import type { PhoneContentDefinition } from '../../phone/PhoneTypes';
import { PHASE8_PHONE_CONTENT } from './phase8PhoneContent';

export const PHASE9_PREP_PHOTO_ID = 'phase9-demo-prep-photo';

export const PHASE9_PHONE_CONTENT = {
  threads: [...PHASE8_PHONE_CONTENT.threads],
  messages: [...PHASE8_PHONE_CONTENT.messages],
  photos: [
    ...PHASE8_PHONE_CONTENT.photos,
    {
      id: PHASE9_PREP_PHOTO_ID,
      src: '/demo/phase9-prep-placeholder.svg',
      alt: 'A fictional illustration of two prepared picnic items on a table',
      caption: 'A fictional preparation-room memory',
      date: '2026-06-14',
    },
  ],
} as const satisfies PhoneContentDefinition;
