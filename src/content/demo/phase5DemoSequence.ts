import type { EventSequence } from '../../events/EventTypes';
import {
  PHASE4_DEMO_MESSAGE_ID,
  PHASE4_DEMO_PHOTO_ID,
} from './phase4PhoneContent';
import { PHASE6_AFTER_DELIVERY_CHECKPOINT_ID } from './phase6CheckpointIds';
import {
  PHASE5_GARDEN_SCENE_ID,
  PHASE5_GARDEN_TASK_ID,
  PHASE5_HELPER_NPC_ID,
} from './phase5Scenes';

export const PHASE5_DEMO_SEQUENCE = {
  id: 'phase-5-demo',
  events: [
    {
      type: 'set_date',
      date: '2026-02-14',
    },
    {
      type: 'set_objective',
      objective: {
        id: 'demo-garden-delivery',
        text: 'Meet the helper in the next scene.',
      },
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'phase-5-room-intro',
        lines: [
          { speaker: 'Helper', text: 'This room is only the beginning.' },
          { speaker: 'Helper', text: 'Let us try the garden next.' },
        ],
      },
    },
    {
      type: 'unlock_message',
      messageId: PHASE4_DEMO_MESSAGE_ID,
    },
    {
      type: 'change_scene',
      sceneId: PHASE5_GARDEN_SCENE_ID,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'phase-5-garden-arrival',
        lines: [
          { speaker: 'Helper', text: 'Welcome to the demo garden!' },
          { speaker: 'Helper', text: 'The old room and its colliders are gone now.' },
        ],
      },
    },
    {
      type: 'move_npc',
      npcId: PHASE5_HELPER_NPC_ID,
      position: { x: -1.35, y: 0.87, z: 4.8 },
    },
    {
      type: 'speech',
      npcId: PHASE5_HELPER_NPC_ID,
      text: 'Bring the three items to the green counter!',
      durationSeconds: 1.5,
    },
    {
      type: 'wait',
      durationSeconds: 1.5,
    },
    {
      type: 'task',
      taskId: PHASE5_GARDEN_TASK_ID,
    },
    {
      type: 'unlock_photo',
      photoId: PHASE4_DEMO_PHOTO_ID,
    },
    {
      type: 'set_objective',
      objective: null,
    },
    {
      type: 'speech',
      npcId: PHASE5_HELPER_NPC_ID,
      text: 'The scene transition worked!',
      durationSeconds: 2,
    },
    {
      type: 'wait',
      durationSeconds: 2,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'phase-5-outro',
        lines: [
          { speaker: 'Helper', text: 'Great work. You can explore this scene now.' },
        ],
      },
    },
    {
      type: 'set_checkpoint',
      checkpointId: PHASE6_AFTER_DELIVERY_CHECKPOINT_ID,
    },
  ],
} as const satisfies EventSequence;

export const PHASE5_GARDEN_TALK_SEQUENCE = {
  id: 'phase-5-garden-talk',
  events: [
    {
      type: 'dialogue',
      sequence: {
        id: 'phase-5-garden-talk-dialogue',
        lines: [
          { speaker: 'Helper', text: 'Everything here belongs to the current scene.' },
        ],
      },
    },
  ],
} as const satisfies EventSequence;
