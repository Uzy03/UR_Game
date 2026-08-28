import type { AudioContentDefinition } from '../../audio/AudioTypes';

export const CAMPAIGN_MAIN_BGM_ID = 'campaign-main-bgm';
export const CAMPAIGN_ENDING_BGM_ID = 'campaign-ending-bgm';
export const CAMPAIGN_TRANSITION_SFX_ID = 'campaign-transition-sfx';
export const CAMPAIGN_MEMORY_SFX_ID = 'campaign-memory-sfx';
export const CAMPAIGN_ENDING_CHIME_SFX_ID = 'campaign-ending-chime-sfx';

export const CAMPAIGN_AUDIO_CONTENT = {
  clips: [
    {
      id: CAMPAIGN_MAIN_BGM_ID,
      src: '/audio/campaign-main-loop.wav',
      kind: 'bgm',
      volume: 0.22,
      loop: true,
    },
    {
      id: CAMPAIGN_ENDING_BGM_ID,
      src: '/audio/campaign-ending-loop.wav',
      kind: 'bgm',
      volume: 0.24,
      loop: true,
    },
    {
      id: CAMPAIGN_TRANSITION_SFX_ID,
      src: '/audio/transition-soft.wav',
      kind: 'sfx',
      volume: 0.36,
    },
    {
      id: CAMPAIGN_MEMORY_SFX_ID,
      src: '/audio/memory-unlock.wav',
      kind: 'sfx',
      volume: 0.32,
    },
    {
      id: CAMPAIGN_ENDING_CHIME_SFX_ID,
      src: '/audio/ending-chime.wav',
      kind: 'sfx',
      volume: 0.38,
    },
  ],
} as const satisfies AudioContentDefinition;
