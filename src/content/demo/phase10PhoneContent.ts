import type { PhoneContentDefinition } from '../../phone/PhoneTypes';
import { PHASE9_PHONE_CONTENT } from './phase9PhoneContent';

export const PHASE10_ASSEMBLY_PHOTO_ID = 'phase10-demo-assembly-photo';

export const PHASE10_PHONE_CONTENT = {
  threads: [...PHASE9_PHONE_CONTENT.threads],
  messages: [...PHASE9_PHONE_CONTENT.messages],
  photos: [
    ...PHASE9_PHONE_CONTENT.photos,
    {
      id: PHASE10_ASSEMBLY_PHOTO_ID,
      src: '/demo/phase10-assembly-placeholder.svg',
      alt: 'A fictional illustration of two components assembled into a blue bundle',
      caption: 'A fictional assembly-room memory',
      date: '2026-07-05',
    },
  ],
} as const satisfies PhoneContentDefinition;
