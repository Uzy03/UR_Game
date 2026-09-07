import type { TransitionCardDefinition } from '../../events/EventTypes';
import type { CampaignStoryDefinition } from './CampaignStoryTypes';

export interface CampaignTransitionCards {
  readonly meeting: TransitionCardDefinition;
  readonly outing: TransitionCardDefinition;
  readonly preparation: TransitionCardDefinition;
  readonly journey: TransitionCardDefinition;
  readonly ending: TransitionCardDefinition;
  readonly all: readonly TransitionCardDefinition[];
}

export function createCampaignTransitionCards(
  story: CampaignStoryDefinition,
): CampaignTransitionCards {
  const meeting = createCard('campaign-card-meeting', 2.4, story.meeting.transition);
  const outing = createCard('campaign-card-outing', 2.2, story.outing.transition);
  const preparation = createCard(
    'campaign-card-preparation',
    2.2,
    story.preparation.transition,
  );
  const journey = createCard('campaign-card-journey', 2.3, story.journey.transition);
  const ending = createCard('campaign-card-ending', 2.5, story.ending.transition);
  return {
    meeting,
    outing,
    preparation,
    journey,
    ending,
    all: [meeting, outing, preparation, journey, ending],
  };
}

function createCard(
  id: string,
  durationSeconds: number,
  content: CampaignStoryDefinition['meeting']['transition'],
): TransitionCardDefinition {
  return { id, durationSeconds, ...content };
}
