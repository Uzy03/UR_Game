import type { AudioContentDefinition } from '../../audio/AudioTypes';
import type { PhoneContentDefinition } from '../../phone/PhoneTypes';
import type { CheckpointDefinition } from '../../save/CheckpointTypes';
import type { SceneDefinition } from '../../scene/SceneTypes';
import { PHASE10_CHECKPOINTS } from '../demo/phase10Checkpoints';
import { PHASE10_PHONE_CONTENT } from '../demo/phase10PhoneContent';
import { PHASE10_SCENES } from '../demo/phase10Scenes';
import { createCampaignCheckpoints } from './campaignCheckpoints';
import { CAMPAIGN_AUDIO_CONTENT } from './campaignAudioContent';
import type { CampaignStoryDefinition } from './CampaignStoryTypes';
import { parseCampaignStoryDefinition } from './CampaignStoryValidation';
import {
  CAMPAIGN_BEDROOM_SCENE_ID,
  CAMPAIGN_INITIAL_CHECKPOINT_ID,
} from './campaignIds';
import { createCampaignPhoneContent } from './campaignPhoneContent';
import { createCampaignPhoneStory } from './campaignPhoneStory';
import { createCampaignScenes } from './campaignScenes';
import { createCampaignSequences } from './campaignSequences';
import { createCampaignTransitionCards } from './campaignTransitionCards';
import { createCampaignWorldRoute } from './campaignWorldRoute';
import type { WorldRouteDefinition } from '../../world/WorldRoute';

export interface CampaignContentBundle {
  readonly scenes: readonly SceneDefinition[];
  readonly checkpoints: readonly CheckpointDefinition[];
  readonly phoneContent: PhoneContentDefinition;
  readonly audioContent: AudioContentDefinition;
  readonly initialSceneId: string;
  readonly initialCheckpointId: string;
  readonly worldRoute: WorldRouteDefinition;
}

// This factory injects story text into fixed public mechanics and IDs only.
export function createCampaignContent(
  storyDefinition: CampaignStoryDefinition,
): CampaignContentBundle {
  const story = parseCampaignStoryDefinition(storyDefinition);
  const campaignPhoneContent = createCampaignPhoneContent(story);
  const campaignScenes = createCampaignScenes(story);
  const phoneStory = createCampaignPhoneStory(story);
  const transitions = createCampaignTransitionCards(story);
  const sequences = createCampaignSequences(story, phoneStory, transitions);
  const campaignCheckpoints = createCampaignCheckpoints(story, sequences);

  return {
    scenes: [
      ...PHASE10_SCENES,
      ...campaignScenes,
    ],
    checkpoints: [
      ...PHASE10_CHECKPOINTS,
      ...campaignCheckpoints,
    ],
    phoneContent: {
      threads: [
        ...PHASE10_PHONE_CONTENT.threads,
        ...campaignPhoneContent.threads,
      ],
      messages: [
        ...PHASE10_PHONE_CONTENT.messages,
        ...campaignPhoneContent.messages,
      ],
      photos: [
        ...PHASE10_PHONE_CONTENT.photos,
        ...campaignPhoneContent.photos,
      ],
    },
    audioContent: CAMPAIGN_AUDIO_CONTENT,
    initialSceneId: CAMPAIGN_BEDROOM_SCENE_ID,
    initialCheckpointId: CAMPAIGN_INITIAL_CHECKPOINT_ID,
    worldRoute: createCampaignWorldRoute(sequences),
  };
}
