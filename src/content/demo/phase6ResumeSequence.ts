import type { EventSequence } from '../../events/EventTypes';
import { PHASE5_HELPER_NPC_ID } from './phase5Scenes';

export const PHASE6_GARDEN_RESUME_SEQUENCE = {
  id: 'phase-6-garden-resume',
  events: [
    {
      type: 'dialogue',
      sequence: {
        id: 'phase-6-garden-resume-dialogue',
        lines: [
          {
            speaker: 'Helper',
            text: 'Welcome back. The completed delivery is safely remembered.',
          },
        ],
      },
    },
    {
      type: 'speech',
      npcId: PHASE5_HELPER_NPC_ID,
      text: 'You can keep exploring from here.',
      durationSeconds: 1.5,
    },
    {
      type: 'wait',
      durationSeconds: 1.5,
    },
  ],
} as const satisfies EventSequence;
