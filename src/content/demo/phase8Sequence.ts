import type { EventSequence } from '../../events/EventTypes';
import {
  PHASE8_COMPLETE_CHECKPOINT_ID,
  PHASE8_FOUNTAIN_REACH_TASK_ID,
  PHASE8_FRIEND_NPC_ID,
  PHASE8_PLACEMENT_TASK_ID,
  PHASE8_VIEWPOINT_REACH_TASK_ID,
} from './phase8Ids';
import { PHASE8_PROMENADE_PHOTO_ID } from './phase8PhoneContent';

export const PHASE8_MAIN_SEQUENCE = {
  id: 'phase-8-promenade-journey',
  events: [
    {
      type: 'set_date',
      date: '2026-05-03',
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'phase8-promenade-intro',
        lines: [
          { speaker: 'Demo Friend', text: 'It is a good day for a fictional walk.' },
          { speaker: 'Player', text: 'Let us set up the bench before we explore.' },
        ],
      },
    },
    {
      type: 'set_objective',
      objective: {
        id: 'phase8-place-picnic-box',
        text: 'Bring the picnic box to the bench.',
      },
    },
    {
      type: 'task',
      taskId: PHASE8_PLACEMENT_TASK_ID,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'phase8-after-picnic-box',
        lines: [
          { speaker: 'Demo Friend', text: 'Perfect. The path begins by the fountain.' },
        ],
      },
    },
    {
      type: 'set_objective',
      objective: {
        id: 'phase8-walk-to-fountain',
        text: 'Walk to the fountain.',
      },
    },
    {
      type: 'task',
      taskId: PHASE8_FOUNTAIN_REACH_TASK_ID,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'phase8-at-fountain',
        lines: [
          { speaker: 'Demo Friend', text: 'We made it. The viewpoint is just ahead.' },
          { speaker: 'Player', text: 'I will meet you there.' },
        ],
      },
    },
    {
      type: 'move_npc',
      npcId: PHASE8_FRIEND_NPC_ID,
      position: { x: -1.2, y: 0.87, z: -2.2 },
    },
    {
      type: 'set_objective',
      objective: {
        id: 'phase8-walk-to-viewpoint',
        text: 'Walk to the viewpoint.',
      },
    },
    {
      type: 'task',
      taskId: PHASE8_VIEWPOINT_REACH_TASK_ID,
    },
    {
      type: 'unlock_photo',
      photoId: PHASE8_PROMENADE_PHOTO_ID,
    },
    {
      type: 'set_objective',
      objective: null,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'phase8-promenade-outro',
        lines: [
          { speaker: 'Demo Friend', text: 'The whole demo promenade is behind us now.' },
          { speaker: 'Player', text: 'That was a pleasant little journey.' },
        ],
      },
    },
    {
      type: 'set_checkpoint',
      checkpointId: PHASE8_COMPLETE_CHECKPOINT_ID,
    },
    {
      type: 'speech',
      npcId: PHASE8_FRIEND_NPC_ID,
      text: 'The fictional journey is complete!',
      durationSeconds: 2,
    },
    {
      type: 'wait',
      durationSeconds: 2,
    },
  ],
} as const satisfies EventSequence;

export const PHASE8_COMPLETE_RESUME_SEQUENCE = {
  id: 'phase-8-promenade-resume',
  events: [
    {
      type: 'speech',
      npcId: PHASE8_FRIEND_NPC_ID,
      text: 'Welcome back. The demo promenade is open to explore.',
      durationSeconds: 2,
    },
    {
      type: 'wait',
      durationSeconds: 2,
    },
  ],
} as const satisfies EventSequence;
