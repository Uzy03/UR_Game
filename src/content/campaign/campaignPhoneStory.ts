import type { PhoneStoryCard } from '../../phone/PhoneTypes';
import type { CampaignStoryDefinition } from './CampaignStoryTypes';

export interface CampaignPhoneStoryCards {
  readonly connection: PhoneStoryCard;
  readonly invitation: PhoneStoryCard;
  readonly ending: PhoneStoryCard;
}

export function createCampaignPhoneStory(
  story: CampaignStoryDefinition,
): CampaignPhoneStoryCards {
  return {
    connection: {
      id: 'campaign-connection-card',
      ...story.prologue.connectionCard,
    },
    invitation: {
      id: 'campaign-invitation-card',
      ...story.prologue.invitationCard,
    },
    ending: {
      id: 'campaign-ending-card',
      ...story.ending.card,
    },
  };
}
