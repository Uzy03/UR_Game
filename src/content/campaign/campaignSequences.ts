import type { EventSequence, GameEvent } from '../../events/EventTypes';
import {
  CAMPAIGN_AFTER_MEETING_CHECKPOINT_ID,
  CAMPAIGN_AFTER_OUTING_CHECKPOINT_ID,
  CAMPAIGN_AFTER_PREPARATION_CHECKPOINT_ID,
  CAMPAIGN_ASSEMBLY_TASK_ID,
  CAMPAIGN_CAFE_PLACEMENT_TASK_ID,
  CAMPAIGN_CAFE_SCENE_ID,
  CAMPAIGN_COMPANION_NPC_ID,
  CAMPAIGN_COMPLETE_CHECKPOINT_ID,
  CAMPAIGN_ENDING_SCENE_ID,
  CAMPAIGN_PARK_FIRST_REACH_TASK_ID,
  CAMPAIGN_PARK_SCENE_ID,
  CAMPAIGN_PARK_SECOND_REACH_TASK_ID,
  CAMPAIGN_PREP_PLACEMENT_TASK_ID,
  CAMPAIGN_PREP_SCENE_ID,
  CAMPAIGN_PROCESSING_TASK_ID,
  CAMPAIGN_BEFORE_ENDING_CHECKPOINT_ID,
  CAMPAIGN_VIEWPOINT_PLACEMENT_TASK_ID,
  CAMPAIGN_VIEWPOINT_SCENE_ID,
} from './campaignIds';
import {
  CAMPAIGN_ENDING_MESSAGE_ID,
  CAMPAIGN_ENDING_PHOTO_ID,
  CAMPAIGN_INVITATION_MESSAGE_ID,
  CAMPAIGN_MEETING_PHOTO_ID,
  CAMPAIGN_OUTING_MESSAGE_ID,
  CAMPAIGN_OUTING_PHOTO_ID,
  CAMPAIGN_PREPARATION_MESSAGE_ID,
  CAMPAIGN_PREPARATION_PHOTO_ID,
  CAMPAIGN_VIEWPOINT_PHOTO_ID,
} from './campaignPhoneContent';
import {
  CAMPAIGN_CONNECTION_CARD,
  CAMPAIGN_ENDING_CARD,
  CAMPAIGN_INVITATION_CARD,
} from './campaignPhoneStory';

type CampaignSegmentKey =
  | 'prologue'
  | 'meeting'
  | 'outing'
  | 'preparation'
  | 'journey'
  | 'ending';

const CAMPAIGN_SEGMENTS = {
  prologue: [
    {
      type: 'set_date',
      date: '2042-04-12',
    },
    {
      type: 'set_objective',
      objective: {
        id: 'campaign-check-phone',
        text: 'Check the fictional story on your phone.',
      },
    },
    {
      type: 'phone_story',
      card: CAMPAIGN_CONNECTION_CARD,
    },
    {
      type: 'phone_story',
      card: CAMPAIGN_INVITATION_CARD,
    },
    {
      type: 'unlock_message',
      messageId: CAMPAIGN_INVITATION_MESSAGE_ID,
    },
    {
      type: 'set_objective',
      objective: {
        id: 'campaign-meet-at-cafe',
        text: 'Meet Demo Companion at Lantern Cafe.',
      },
    },
    {
      type: 'change_scene',
      sceneId: CAMPAIGN_CAFE_SCENE_ID,
    },
  ],
  meeting: [
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-meeting-intro',
        lines: [
          { speaker: 'Demo Companion', text: 'Welcome to our entirely fictional cafe.' },
          { speaker: 'Player', text: 'I will bring the two demo drinks to the table.' },
        ],
      },
    },
    {
      type: 'set_objective',
      objective: {
        id: 'campaign-serve-drinks',
        text: 'Bring both drinks to the cafe table.',
      },
    },
    {
      type: 'task',
      taskId: CAMPAIGN_CAFE_PLACEMENT_TASK_ID,
    },
    {
      type: 'move_npc',
      npcId: CAMPAIGN_COMPANION_NPC_ID,
      position: { x: 1.2, y: 0.87, z: 1.8 },
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-meeting-outro',
        lines: [
          { speaker: 'Demo Companion', text: 'The table is ready. Shall we visit the park?' },
          { speaker: 'Player', text: 'That sounds like a good next chapter for this demo.' },
        ],
      },
    },
    {
      type: 'unlock_photo',
      photoId: CAMPAIGN_MEETING_PHOTO_ID,
    },
    {
      type: 'set_objective',
      objective: null,
    },
    {
      type: 'set_checkpoint',
      checkpointId: CAMPAIGN_AFTER_MEETING_CHECKPOINT_ID,
    },
  ],
  outing: [
    {
      type: 'change_scene',
      sceneId: CAMPAIGN_PARK_SCENE_ID,
    },
    {
      type: 'set_date',
      date: '2042-05-03',
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-outing-intro',
        lines: [
          { speaker: 'Demo Companion', text: 'The first marker is beside the fountain.' },
          { speaker: 'Player', text: 'I will follow the path rather than rush ahead.' },
        ],
      },
    },
    {
      type: 'set_objective',
      objective: {
        id: 'campaign-reach-fountain',
        text: 'Walk to the fountain marker.',
      },
    },
    {
      type: 'task',
      taskId: CAMPAIGN_PARK_FIRST_REACH_TASK_ID,
    },
    {
      type: 'move_npc',
      npcId: CAMPAIGN_COMPANION_NPC_ID,
      position: { x: -3.2, y: 0.87, z: 0.8 },
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-outing-middle',
        lines: [
          { speaker: 'Demo Companion', text: 'The lantern overlook is only a short walk away.' },
        ],
      },
    },
    {
      type: 'set_objective',
      objective: {
        id: 'campaign-reach-overlook',
        text: 'Walk to the lantern overlook.',
      },
    },
    {
      type: 'task',
      taskId: CAMPAIGN_PARK_SECOND_REACH_TASK_ID,
    },
    {
      type: 'unlock_photo',
      photoId: CAMPAIGN_OUTING_PHOTO_ID,
    },
    {
      type: 'unlock_message',
      messageId: CAMPAIGN_OUTING_MESSAGE_ID,
    },
    {
      type: 'set_objective',
      objective: null,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-outing-outro',
        lines: [
          { speaker: 'Player', text: 'The short route gave this fictional outing a calm rhythm.' },
        ],
      },
    },
    {
      type: 'set_checkpoint',
      checkpointId: CAMPAIGN_AFTER_OUTING_CHECKPOINT_ID,
    },
  ],
  preparation: [
    {
      type: 'change_scene',
      sceneId: CAMPAIGN_PREP_SCENE_ID,
    },
    {
      type: 'set_date',
      date: '2042-06-14',
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-preparation-intro',
        lines: [
          { speaker: 'Demo Companion', text: 'Two placeholder items need a quick preparation.' },
          { speaker: 'Player', text: 'I will process each one, then move both to the table.' },
        ],
      },
    },
    {
      type: 'set_objective',
      objective: {
        id: 'campaign-process-items',
        text: 'Process both picnic items.',
      },
    },
    {
      type: 'task',
      taskId: CAMPAIGN_PROCESSING_TASK_ID,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-preparation-ready',
        lines: [
          { speaker: 'Demo Companion', text: 'Both items are prepared and ready to carry.' },
        ],
      },
    },
    {
      type: 'set_objective',
      objective: {
        id: 'campaign-place-prepared-items',
        text: 'Bring both prepared items to the right table.',
      },
    },
    {
      type: 'task',
      taskId: CAMPAIGN_PREP_PLACEMENT_TASK_ID,
    },
    {
      type: 'unlock_photo',
      photoId: CAMPAIGN_PREPARATION_PHOTO_ID,
    },
    {
      type: 'unlock_message',
      messageId: CAMPAIGN_PREPARATION_MESSAGE_ID,
    },
    {
      type: 'set_objective',
      objective: null,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-preparation-outro',
        lines: [
          { speaker: 'Player', text: 'Everything is ready for the fictional viewpoint.' },
        ],
      },
    },
    {
      type: 'set_checkpoint',
      checkpointId: CAMPAIGN_AFTER_PREPARATION_CHECKPOINT_ID,
    },
  ],
  journey: [
    {
      type: 'change_scene',
      sceneId: CAMPAIGN_VIEWPOINT_SCENE_ID,
    },
    {
      type: 'set_date',
      date: '2042-07-05',
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-journey-intro',
        lines: [
          { speaker: 'Demo Companion', text: 'Let us combine the two components at the blue station.' },
          { speaker: 'Player', text: 'Then I will deliver the finished bundle to the overlook.' },
        ],
      },
    },
    {
      type: 'set_objective',
      objective: {
        id: 'campaign-combine-components',
        text: 'Combine the two viewpoint components.',
      },
    },
    {
      type: 'task',
      taskId: CAMPAIGN_ASSEMBLY_TASK_ID,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-journey-ready',
        lines: [
          { speaker: 'Demo Companion', text: 'The finished bundle is waiting on the station.' },
        ],
      },
    },
    {
      type: 'set_objective',
      objective: {
        id: 'campaign-deliver-bundle',
        text: 'Bring the finished bundle to the overlook table.',
      },
    },
    {
      type: 'task',
      taskId: CAMPAIGN_VIEWPOINT_PLACEMENT_TASK_ID,
    },
    {
      type: 'unlock_photo',
      photoId: CAMPAIGN_VIEWPOINT_PHOTO_ID,
    },
    {
      type: 'set_objective',
      objective: null,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-journey-outro',
        lines: [
          { speaker: 'Demo Companion', text: 'One quiet room remains for the campaign finale.' },
        ],
      },
    },
    {
      type: 'set_checkpoint',
      checkpointId: CAMPAIGN_BEFORE_ENDING_CHECKPOINT_ID,
    },
  ],
  ending: [
    {
      type: 'change_scene',
      sceneId: CAMPAIGN_ENDING_SCENE_ID,
    },
    {
      type: 'set_date',
      date: '2042-08-09',
    },
    {
      type: 'phone_story',
      card: CAMPAIGN_ENDING_CARD,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-ending-intro',
        lines: [
          { speaker: 'Demo Companion', text: 'The placeholder album now shows our whole demo route.' },
          { speaker: 'Player', text: 'Every mechanic became one continuous fictional journey.' },
        ],
      },
    },
    {
      type: 'unlock_message',
      messageId: CAMPAIGN_ENDING_MESSAGE_ID,
    },
    {
      type: 'unlock_photo',
      photoId: CAMPAIGN_ENDING_PHOTO_ID,
    },
    {
      type: 'set_objective',
      objective: null,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-ending-final',
        lines: [
          { speaker: 'Demo Companion', text: 'This fictional skeleton is ready for pacing feedback.' },
          { speaker: 'Player', text: 'The real story can remain private until a later phase.' },
        ],
      },
    },
    {
      type: 'set_checkpoint',
      checkpointId: CAMPAIGN_COMPLETE_CHECKPOINT_ID,
    },
    {
      type: 'speech',
      npcId: CAMPAIGN_COMPANION_NPC_ID,
      text: 'Fictional campaign complete!',
      durationSeconds: 2.5,
    },
    {
      type: 'wait',
      durationSeconds: 2,
    },
  ],
} as const satisfies Record<CampaignSegmentKey, readonly GameEvent[]>;

const CAMPAIGN_SEGMENT_ORDER = [
  'prologue',
  'meeting',
  'outing',
  'preparation',
  'journey',
  'ending',
] as const satisfies readonly CampaignSegmentKey[];

function createCampaignResumeSequence(
  id: string,
  startSegment: CampaignSegmentKey,
): EventSequence {
  const startIndex = CAMPAIGN_SEGMENT_ORDER.indexOf(startSegment);
  const events: GameEvent[] = [];
  for (const segment of CAMPAIGN_SEGMENT_ORDER.slice(startIndex)) {
    events.push(...CAMPAIGN_SEGMENTS[segment]);
  }
  return {
    id,
    events,
  };
}

export const CAMPAIGN_MAIN_SEQUENCE = createCampaignResumeSequence(
  'campaign-main',
  'prologue',
);

export const CAMPAIGN_AFTER_MEETING_RESUME_SEQUENCE = createCampaignResumeSequence(
  'campaign-resume-after-meeting',
  'outing',
);

export const CAMPAIGN_AFTER_OUTING_RESUME_SEQUENCE = createCampaignResumeSequence(
  'campaign-resume-after-outing',
  'preparation',
);

export const CAMPAIGN_AFTER_PREPARATION_RESUME_SEQUENCE = createCampaignResumeSequence(
  'campaign-resume-after-preparation',
  'journey',
);

export const CAMPAIGN_BEFORE_ENDING_RESUME_SEQUENCE = createCampaignResumeSequence(
  'campaign-resume-before-ending',
  'ending',
);

export const CAMPAIGN_COMPLETE_RESUME_SEQUENCE = {
  id: 'campaign-complete-resume',
  events: [
    {
      type: 'speech',
      npcId: CAMPAIGN_COMPANION_NPC_ID,
      text: 'Welcome back to the completed fictional campaign.',
      durationSeconds: 2.5,
    },
    {
      type: 'wait',
      durationSeconds: 2,
    },
  ],
} as const satisfies EventSequence;

export const CAMPAIGN_SEGMENT_EVENT_COUNTS = Object.fromEntries(
  CAMPAIGN_SEGMENT_ORDER.map((segment) => [segment, CAMPAIGN_SEGMENTS[segment].length]),
) as Readonly<Record<CampaignSegmentKey, number>>;
