import type { EventSequence } from '../../events/EventTypes';
import {
  PHASE9_COMPANION_NPC_ID,
  PHASE9_COMPLETE_CHECKPOINT_ID,
  PHASE9_PLACEMENT_TASK_ID,
  PHASE9_PROCESSING_TASK_ID,
} from './phase9Ids';
import { PHASE9_PREP_PHOTO_ID } from './phase9PhoneContent';

export const PHASE9_MAIN_SEQUENCE = {
  id: 'phase-9-preparation',
  events: [
    {
      type: 'set_date',
      date: '2026-06-14',
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'phase9-prep-intro',
        lines: [
          { speaker: 'Demo Companion', text: 'Let us prepare two fictional picnic items.' },
          { speaker: 'Player', text: 'I will use the green station one item at a time.' },
        ],
      },
    },
    {
      type: 'set_objective',
      objective: {
        id: 'phase9-process-items',
        text: 'Process both picnic items.',
      },
    },
    {
      type: 'task',
      taskId: PHASE9_PROCESSING_TASK_ID,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'phase9-items-ready',
        lines: [
          { speaker: 'Demo Companion', text: 'Both items are ready for the table.' },
          { speaker: 'Player', text: 'I will carry them over now.' },
        ],
      },
    },
    {
      type: 'set_objective',
      objective: {
        id: 'phase9-place-items',
        text: 'Bring both prepared items to the table.',
      },
    },
    {
      type: 'task',
      taskId: PHASE9_PLACEMENT_TASK_ID,
    },
    {
      type: 'unlock_photo',
      photoId: PHASE9_PREP_PHOTO_ID,
    },
    {
      type: 'set_objective',
      objective: null,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'phase9-prep-outro',
        lines: [
          { speaker: 'Demo Companion', text: 'The fictional picnic preparation is complete.' },
          { speaker: 'Player', text: 'Everything is ready for the next demo journey.' },
        ],
      },
    },
    {
      type: 'set_checkpoint',
      checkpointId: PHASE9_COMPLETE_CHECKPOINT_ID,
    },
    {
      type: 'speech',
      npcId: PHASE9_COMPANION_NPC_ID,
      text: 'Processing and delivery complete!',
      durationSeconds: 2,
    },
    {
      type: 'wait',
      durationSeconds: 2,
    },
  ],
} as const satisfies EventSequence;

export const PHASE9_COMPLETE_RESUME_SEQUENCE = {
  id: 'phase-9-prep-resume',
  events: [
    {
      type: 'speech',
      npcId: PHASE9_COMPANION_NPC_ID,
      text: 'Welcome back to the fictional preparation room.',
      durationSeconds: 2,
    },
    {
      type: 'wait',
      durationSeconds: 2,
    },
  ],
} as const satisfies EventSequence;
