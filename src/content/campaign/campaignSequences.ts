import type { EventSequence, GameEvent } from '../../events/EventTypes';
import {
  CAMPAIGN_ENDING_BGM_ID,
  CAMPAIGN_ENDING_CHIME_SFX_ID,
  CAMPAIGN_MAIN_BGM_ID,
  CAMPAIGN_MEMORY_SFX_ID,
  CAMPAIGN_TRANSITION_SFX_ID,
} from './campaignAudioContent';
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
import type { CampaignPhoneStoryCards } from './campaignPhoneStory';
import type { CampaignStoryDefinition } from './CampaignStoryTypes';
import type { CampaignTransitionCards } from './campaignTransitionCards';

type CampaignSegmentKey =
  | 'prologue'
  | 'meeting'
  | 'outing'
  | 'preparation'
  | 'journey'
  | 'ending';

const PLAY_MAIN_BGM_EVENT = {
  type: 'audio_cue',
  cue: {
    kind: 'play_bgm',
    audioId: CAMPAIGN_MAIN_BGM_ID,
    fadeSeconds: 0.8,
  },
} as const satisfies GameEvent;

const PLAY_ENDING_BGM_EVENT = {
  type: 'audio_cue',
  cue: {
    kind: 'play_bgm',
    audioId: CAMPAIGN_ENDING_BGM_ID,
    fadeSeconds: 1,
  },
} as const satisfies GameEvent;

const PLAY_TRANSITION_SFX_EVENT = {
  type: 'audio_cue',
  cue: {
    kind: 'play_sfx',
    audioId: CAMPAIGN_TRANSITION_SFX_ID,
  },
} as const satisfies GameEvent;

const PLAY_MEMORY_SFX_EVENT = {
  type: 'audio_cue',
  cue: {
    kind: 'play_sfx',
    audioId: CAMPAIGN_MEMORY_SFX_ID,
  },
} as const satisfies GameEvent;

const PLAY_ENDING_CHIME_EVENT = {
  type: 'audio_cue',
  cue: {
    kind: 'play_sfx',
    audioId: CAMPAIGN_ENDING_CHIME_SFX_ID,
  },
} as const satisfies GameEvent;

export interface CampaignSequences {
  readonly main: EventSequence;
  readonly afterMeeting: EventSequence;
  readonly afterOuting: EventSequence;
  readonly afterPreparation: EventSequence;
  readonly beforeEnding: EventSequence;
  readonly complete: EventSequence;
  readonly segmentEventCounts: Readonly<Record<CampaignSegmentKey, number>>;
}

export function createCampaignSequences(
  story: CampaignStoryDefinition,
  phoneStory: CampaignPhoneStoryCards,
  transitions: CampaignTransitionCards,
): CampaignSequences {
  const campaignSegments = {
  prologue: [
    PLAY_MAIN_BGM_EVENT,
    {
      type: 'set_date',
      date: story.prologue.date,
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
      card: phoneStory.connection,
    },
    {
      type: 'phone_story',
      card: phoneStory.invitation,
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
    PLAY_TRANSITION_SFX_EVENT,
    {
      type: 'transition_card',
      card: transitions.meeting,
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
        lines: story.meeting.dialogueIntro,
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
        lines: story.meeting.dialogueOutro,
      },
    },
    {
      type: 'unlock_photo',
      photoId: CAMPAIGN_MEETING_PHOTO_ID,
    },
    PLAY_MEMORY_SFX_EVENT,
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
    PLAY_MAIN_BGM_EVENT,
    PLAY_TRANSITION_SFX_EVENT,
    {
      type: 'transition_card',
      card: transitions.outing,
    },
    {
      type: 'change_scene',
      sceneId: CAMPAIGN_PARK_SCENE_ID,
    },
    {
      type: 'set_date',
      date: story.outing.date,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-outing-intro',
        lines: story.outing.dialogueIntro,
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
        lines: story.outing.dialogueMiddle,
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
    PLAY_MEMORY_SFX_EVENT,
    {
      type: 'set_objective',
      objective: null,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-outing-outro',
        lines: story.outing.dialogueOutro,
      },
    },
    {
      type: 'set_checkpoint',
      checkpointId: CAMPAIGN_AFTER_OUTING_CHECKPOINT_ID,
    },
  ],
  preparation: [
    PLAY_MAIN_BGM_EVENT,
    PLAY_TRANSITION_SFX_EVENT,
    {
      type: 'transition_card',
      card: transitions.preparation,
    },
    {
      type: 'change_scene',
      sceneId: CAMPAIGN_PREP_SCENE_ID,
    },
    {
      type: 'set_date',
      date: story.preparation.date,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-preparation-intro',
        lines: story.preparation.dialogueIntro,
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
        lines: story.preparation.dialogueReady,
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
    PLAY_MEMORY_SFX_EVENT,
    {
      type: 'set_objective',
      objective: null,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-preparation-outro',
        lines: story.preparation.dialogueOutro,
      },
    },
    {
      type: 'set_checkpoint',
      checkpointId: CAMPAIGN_AFTER_PREPARATION_CHECKPOINT_ID,
    },
  ],
  journey: [
    PLAY_MAIN_BGM_EVENT,
    PLAY_TRANSITION_SFX_EVENT,
    {
      type: 'transition_card',
      card: transitions.journey,
    },
    {
      type: 'change_scene',
      sceneId: CAMPAIGN_VIEWPOINT_SCENE_ID,
    },
    {
      type: 'set_date',
      date: story.journey.date,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-journey-intro',
        lines: story.journey.dialogueIntro,
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
        lines: story.journey.dialogueReady,
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
    PLAY_MEMORY_SFX_EVENT,
    {
      type: 'set_objective',
      objective: null,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-journey-outro',
        lines: story.journey.dialogueOutro,
      },
    },
    {
      type: 'set_checkpoint',
      checkpointId: CAMPAIGN_BEFORE_ENDING_CHECKPOINT_ID,
    },
  ],
  ending: [
    PLAY_ENDING_BGM_EVENT,
    PLAY_TRANSITION_SFX_EVENT,
    {
      type: 'transition_card',
      card: transitions.ending,
    },
    {
      type: 'change_scene',
      sceneId: CAMPAIGN_ENDING_SCENE_ID,
    },
    {
      type: 'set_date',
      date: story.ending.date,
    },
    {
      type: 'phone_story',
      card: phoneStory.ending,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-ending-intro',
        lines: story.ending.dialogueIntro,
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
    PLAY_MEMORY_SFX_EVENT,
    {
      type: 'set_objective',
      objective: null,
    },
    {
      type: 'dialogue',
      sequence: {
        id: 'campaign-ending-final',
        lines: story.ending.dialogueFinal,
      },
    },
    PLAY_ENDING_CHIME_EVENT,
    {
      type: 'set_checkpoint',
      checkpointId: CAMPAIGN_COMPLETE_CHECKPOINT_ID,
    },
    {
      type: 'speech',
      npcId: CAMPAIGN_COMPANION_NPC_ID,
      text: story.ending.completionSpeech,
      durationSeconds: 2.5,
    },
    {
      type: 'wait',
      durationSeconds: 2,
    },
  ],
  } satisfies Record<CampaignSegmentKey, readonly GameEvent[]>;

  const main = createCampaignResumeSequence('campaign-main', 'prologue', campaignSegments);
  const afterMeeting = createCampaignResumeSequence(
    'campaign-resume-after-meeting',
    'outing',
    campaignSegments,
  );
  const afterOuting = createCampaignResumeSequence(
    'campaign-resume-after-outing',
    'preparation',
    campaignSegments,
  );
  const afterPreparation = createCampaignResumeSequence(
    'campaign-resume-after-preparation',
    'journey',
    campaignSegments,
  );
  const beforeEnding = createCampaignResumeSequence(
    'campaign-resume-before-ending',
    'ending',
    campaignSegments,
  );
  const complete = {
    id: 'campaign-complete-resume',
    events: [
      PLAY_ENDING_BGM_EVENT,
      {
        type: 'speech',
        npcId: CAMPAIGN_COMPANION_NPC_ID,
        text: story.ending.resumeSpeech,
        durationSeconds: 2.5,
      },
      {
        type: 'wait',
        durationSeconds: 2,
      },
    ],
  } satisfies EventSequence;

  return {
    main,
    afterMeeting,
    afterOuting,
    afterPreparation,
    beforeEnding,
    complete,
    segmentEventCounts: Object.fromEntries(
      CAMPAIGN_SEGMENT_ORDER.map((segment) => [segment, campaignSegments[segment].length]),
    ) as Readonly<Record<CampaignSegmentKey, number>>,
  };
}

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
  segments: Record<CampaignSegmentKey, readonly GameEvent[]>,
): EventSequence {
  const startIndex = CAMPAIGN_SEGMENT_ORDER.indexOf(startSegment);
  const events: GameEvent[] = [];
  for (const segment of CAMPAIGN_SEGMENT_ORDER.slice(startIndex)) {
    events.push(...segments[segment]);
  }
  return {
    id,
    events,
  };
}
