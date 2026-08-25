import type { EventSequence } from '../../events/EventTypes';
import {
  PHASE7_AFTER_MEETING_CHECKPOINT_ID,
  PHASE7_CAFE_SCENE_ID,
  PHASE7_CAFE_TASK_ID,
  PHASE7_PARTNER_NPC_ID,
} from './phase7Ids';
import {
  PHASE7_CAFE_PHOTO_ID,
  PHASE7_INVITATION_MESSAGE_ID,
  PHASE7_REPLY_MESSAGE_ID,
} from './phase7PhoneContent';
import {
  PHASE7_INVITATION_CARD,
  PHASE7_MATCH_CARD,
} from './phase7PhoneStory';

export const PHASE7_MAIN_SEQUENCE = {
  id: 'phase-7-prologue',
  events: [
    {
      type: 'set_date',
      date: '2026-04-12',
    },
    {
      type: 'set_objective',
      objective: {
        id: 'phase7-check-phone',
        text: 'Check your phone.',
      },
    },
    {
      type: 'phone_story',
      card: PHASE7_MATCH_CARD,
    },
    {
      type: 'phone_story',
      card: PHASE7_INVITATION_CARD,
    },
    {
      type: 'unlock_message',
      messageId: PHASE7_INVITATION_MESSAGE_ID,
    },
    {
      type: 'unlock_message',
      messageId: PHASE7_REPLY_MESSAGE_ID,
    },
    {
      type: 'set_objective',
      objective: {
        id: 'phase7-meet-at-cafe',
        text: 'Meet Demo Partner at the cafe.',
      },
    },
    {
      type: 'change_scene',
      sceneId: PHASE7_CAFE_SCENE_ID,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'phase7-first-meeting',
        lines: [
          { speaker: 'Demo Partner', text: 'Hi! Nice to finally meet you.' },
          { speaker: 'Player', text: 'Nice to meet you too.' },
        ],
      },
    },
    {
      type: 'move_npc',
      npcId: PHASE7_PARTNER_NPC_ID,
      position: { x: -1.2, y: 0.87, z: 2.1 },
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'phase7-cafe-follow-up',
        lines: [
          { speaker: 'Demo Partner', text: 'I found us a table by the counter.' },
          { speaker: 'Player', text: 'I will bring the drinks over.' },
        ],
      },
    },
    {
      type: 'set_objective',
      objective: {
        id: 'phase7-bring-drinks',
        text: 'Bring both drinks to the cafe table.',
      },
    },
    {
      type: 'speech',
      npcId: PHASE7_PARTNER_NPC_ID,
      text: 'Two drinks, two places on the table!',
      durationSeconds: 1.5,
    },
    {
      type: 'wait',
      durationSeconds: 1.5,
    },
    {
      type: 'task',
      taskId: PHASE7_CAFE_TASK_ID,
    },
    {
      type: 'unlock_photo',
      photoId: PHASE7_CAFE_PHOTO_ID,
    },
    {
      type: 'set_objective',
      objective: null,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'phase7-cafe-outro',
        lines: [
          { speaker: 'Demo Partner', text: 'Thanks! This demo cafe feels welcoming now.' },
          { speaker: 'Player', text: 'I am glad we met here.' },
        ],
      },
    },
    {
      type: 'set_checkpoint',
      checkpointId: PHASE7_AFTER_MEETING_CHECKPOINT_ID,
    },
    {
      type: 'speech',
      npcId: PHASE7_PARTNER_NPC_ID,
      text: 'The fictional prologue is complete!',
      durationSeconds: 2,
    },
    {
      type: 'wait',
      durationSeconds: 2,
    },
  ],
} as const satisfies EventSequence;

export const PHASE7_CAFE_RESUME_SEQUENCE = {
  id: 'phase-7-cafe-resume',
  events: [
    {
      type: 'speech',
      npcId: PHASE7_PARTNER_NPC_ID,
      text: 'Welcome back. You can explore the demo cafe.',
      durationSeconds: 2,
    },
    {
      type: 'wait',
      durationSeconds: 2,
    },
  ],
} as const satisfies EventSequence;
