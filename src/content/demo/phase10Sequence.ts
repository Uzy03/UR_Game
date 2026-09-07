import type { EventSequence } from '../../events/EventTypes';
import {
  PHASE10_ASSEMBLY_TASK_ID,
  PHASE10_COMPANION_NPC_ID,
  PHASE10_COMPLETE_CHECKPOINT_ID,
  PHASE10_PLACEMENT_TASK_ID,
} from './phase10Ids';
import { PHASE10_ASSEMBLY_PHOTO_ID } from './phase10PhoneContent';

export const PHASE10_MAIN_SEQUENCE = {
  id: 'phase-10-assembly',
  events: [
    {
      type: 'set_date',
      date: '2026-07-05',
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'phase10-assembly-intro',
        lines: [
          { speaker: 'Demo Maker', text: 'Let us assemble one fictional picnic bundle.' },
          { speaker: 'Player', text: 'I will bring both components to the blue station.' },
        ],
      },
    },
    {
      type: 'set_objective',
      objective: {
        id: 'phase10-combine-components',
        text: 'Combine the two demo components.',
      },
    },
    {
      type: 'task',
      taskId: PHASE10_ASSEMBLY_TASK_ID,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'phase10-bundle-ready',
        lines: [
          { speaker: 'Demo Maker', text: 'The finished bundle is ready.' },
          { speaker: 'Player', text: 'I will carry it to the final table.' },
        ],
      },
    },
    {
      type: 'set_objective',
      objective: {
        id: 'phase10-place-bundle',
        text: 'Bring the finished bundle to the table.',
      },
    },
    {
      type: 'task',
      taskId: PHASE10_PLACEMENT_TASK_ID,
    },
    {
      type: 'unlock_photo',
      photoId: PHASE10_ASSEMBLY_PHOTO_ID,
    },
    {
      type: 'set_objective',
      objective: null,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'phase10-assembly-outro',
        lines: [
          { speaker: 'Demo Maker', text: 'The fictional assembly is complete.' },
          { speaker: 'Player', text: 'Our final gameplay building block is ready.' },
        ],
      },
    },
    {
      type: 'set_checkpoint',
      checkpointId: PHASE10_COMPLETE_CHECKPOINT_ID,
    },
    {
      type: 'speech',
      npcId: PHASE10_COMPANION_NPC_ID,
      text: 'Assembly and delivery complete!',
      durationSeconds: 2,
    },
    {
      type: 'wait',
      durationSeconds: 2,
    },
  ],
} as const satisfies EventSequence;

export const PHASE10_COMPLETE_RESUME_SEQUENCE = {
  id: 'phase-10-assembly-resume',
  events: [
    {
      type: 'speech',
      npcId: PHASE10_COMPANION_NPC_ID,
      text: 'Welcome back. The fictional bundle is complete.',
      durationSeconds: 2,
    },
    {
      type: 'wait',
      durationSeconds: 2,
    },
  ],
} as const satisfies EventSequence;
