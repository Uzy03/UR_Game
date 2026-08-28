import type { TransitionCardDefinition } from '../../events/EventTypes';

export const CAMPAIGN_MEETING_TRANSITION_CARD = {
  id: 'campaign-card-meeting',
  eyebrow: '2042.04.12',
  title: 'First Demo Meeting',
  subtitle: 'Lantern Cafe',
  durationSeconds: 2.4,
} as const satisfies TransitionCardDefinition;

export const CAMPAIGN_OUTING_TRANSITION_CARD = {
  id: 'campaign-card-outing',
  eyebrow: '2042.05.03',
  title: 'A Quiet Walk',
  subtitle: 'Demo Park',
  durationSeconds: 2.2,
} as const satisfies TransitionCardDefinition;

export const CAMPAIGN_PREPARATION_TRANSITION_CARD = {
  id: 'campaign-card-preparation',
  eyebrow: '2042.06.14',
  title: 'Getting Ready',
  subtitle: 'Preparation Space',
  durationSeconds: 2.2,
} as const satisfies TransitionCardDefinition;

export const CAMPAIGN_JOURNEY_TRANSITION_CARD = {
  id: 'campaign-card-journey',
  eyebrow: '2042.07.05',
  title: 'A Small Journey',
  subtitle: 'Demo Viewpoint',
  durationSeconds: 2.3,
} as const satisfies TransitionCardDefinition;

export const CAMPAIGN_ENDING_TRANSITION_CARD = {
  id: 'campaign-card-ending',
  eyebrow: '2042.08.09',
  title: 'One Last Memory',
  durationSeconds: 2.5,
} as const satisfies TransitionCardDefinition;

export const CAMPAIGN_TRANSITION_CARDS = [
  CAMPAIGN_MEETING_TRANSITION_CARD,
  CAMPAIGN_OUTING_TRANSITION_CARD,
  CAMPAIGN_PREPARATION_TRANSITION_CARD,
  CAMPAIGN_JOURNEY_TRANSITION_CARD,
  CAMPAIGN_ENDING_TRANSITION_CARD,
] as const satisfies readonly TransitionCardDefinition[];
