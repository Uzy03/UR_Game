import type { PhoneContentDefinition } from '../../phone/PhoneTypes';
import type { CheckpointDefinition } from '../../save/CheckpointTypes';
import type { SceneDefinition } from '../../scene/SceneTypes';
import { PHASE10_CHECKPOINTS } from '../demo/phase10Checkpoints';
import { PHASE10_PHONE_CONTENT } from '../demo/phase10PhoneContent';
import { PHASE10_SCENES } from '../demo/phase10Scenes';
import { CAMPAIGN_CHECKPOINTS } from './campaignCheckpoints';
import {
  CAMPAIGN_BEDROOM_SCENE_ID,
  CAMPAIGN_INITIAL_CHECKPOINT_ID,
} from './campaignIds';
import { CAMPAIGN_PHONE_CONTENT } from './campaignPhoneContent';
import { CAMPAIGN_SCENES } from './campaignScenes';

export interface CampaignContentBundle {
  readonly scenes: readonly SceneDefinition[];
  readonly checkpoints: readonly CheckpointDefinition[];
  readonly phoneContent: PhoneContentDefinition;
  readonly initialSceneId: string;
  readonly initialCheckpointId: string;
}

// This bundle only composes static content. Runtime ownership remains in Game/SceneManager.
export const PHASE12_CONTENT = {
  scenes: [
    ...PHASE10_SCENES,
    ...CAMPAIGN_SCENES,
  ],
  checkpoints: [
    ...PHASE10_CHECKPOINTS,
    ...CAMPAIGN_CHECKPOINTS,
  ],
  phoneContent: {
    threads: [
      ...PHASE10_PHONE_CONTENT.threads,
      ...CAMPAIGN_PHONE_CONTENT.threads,
    ],
    messages: [
      ...PHASE10_PHONE_CONTENT.messages,
      ...CAMPAIGN_PHONE_CONTENT.messages,
    ],
    photos: [
      ...PHASE10_PHONE_CONTENT.photos,
      ...CAMPAIGN_PHONE_CONTENT.photos,
    ],
  },
  initialSceneId: CAMPAIGN_BEDROOM_SCENE_ID,
  initialCheckpointId: CAMPAIGN_INITIAL_CHECKPOINT_ID,
} as const satisfies CampaignContentBundle;
