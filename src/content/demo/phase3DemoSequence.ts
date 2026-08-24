import { GAME_CONFIG } from '../../config/gameConfig';
import type { EventSequence } from '../../events/EventTypes';

export const PHASE3_DEMO_SEQUENCE = {
  id: 'phase-3-demo',
  events: [
    {
      type: 'dialogue',
      sequence: {
        id: 'phase-3-intro',
        lines: [
          { speaker: 'Helper', text: 'Could you help me?' },
          { speaker: 'Helper', text: 'Follow me. I will show you the counter.' },
          { speaker: 'Helper', text: 'Then bring all three items over there.' },
        ],
      },
    },
    {
      type: 'move_npc',
      npcId: GAME_CONFIG.npc.id,
      position: GAME_CONFIG.npc.taskPosition,
    },
    {
      type: 'speech',
      npcId: GAME_CONFIG.npc.id,
      text: "Let's do it!",
      durationSeconds: 1.5,
    },
    {
      type: 'wait',
      durationSeconds: 1.5,
    },
    {
      type: 'task',
      taskId: GAME_CONFIG.phase2.placementTask.id,
    },
    {
      type: 'speech',
      npcId: GAME_CONFIG.npc.id,
      text: 'We did it!',
      durationSeconds: GAME_CONFIG.phase2.speechDurationSeconds,
    },
    {
      type: 'wait',
      durationSeconds: GAME_CONFIG.phase2.speechDurationSeconds,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'phase-3-outro',
        lines: [
          { speaker: 'Helper', text: 'Thanks for helping!' },
        ],
      },
    },
  ],
} as const satisfies EventSequence;
