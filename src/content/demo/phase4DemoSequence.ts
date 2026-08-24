import { GAME_CONFIG } from '../../config/gameConfig';
import type { EventSequence } from '../../events/EventTypes';

export const PHASE4_DEMO_SEQUENCE = {
  id: 'phase-4-demo',
  events: [
    {
      type: 'set_date',
      date: '2026-01-01',
    },
    {
      type: 'set_objective',
      objective: {
        id: 'demo-delivery',
        text: 'Help with the delivery.',
      },
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'phase-4-intro',
        lines: [
          { speaker: 'Helper', text: 'Could you help me?' },
          { speaker: 'Helper', text: 'I sent the details to your phone.' },
          { speaker: 'Helper', text: 'Follow me, then bring all three items over there.' },
        ],
      },
    },
    {
      type: 'unlock_message',
      messageId: 'demo-message-1',
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
      type: 'unlock_photo',
      photoId: 'demo-photo-1',
    },
    {
      type: 'set_objective',
      objective: null,
    },
    {
      type: 'speech',
      npcId: GAME_CONFIG.npc.id,
      text: 'A new memory was added!',
      durationSeconds: GAME_CONFIG.phase2.speechDurationSeconds,
    },
    {
      type: 'wait',
      durationSeconds: GAME_CONFIG.phase2.speechDurationSeconds,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'phase-4-outro',
        lines: [
          { speaker: 'Helper', text: 'Thanks for helping! Check your phone later.' },
        ],
      },
    },
  ],
} as const satisfies EventSequence;
