import type { CampaignStoryDefinition } from './CampaignStoryTypes';

export const FICTIONAL_CAMPAIGN_STORY = {
  phoneThreadTitle: 'Demo Companion',
  prologue: {
    date: '2042-04-12',
    connectionCard: {
      appLabel: 'Daylight',
      title: 'A new fictional connection',
      subtitle: 'Demo Companion',
      body: 'A cheerful hello is waiting in this placeholder story.',
      actionLabel: 'Read hello',
    },
    invitationCard: {
      appLabel: 'Daylight',
      title: 'Meet at Lantern Cafe?',
      subtitle: 'Demo Companion',
      body: 'This fictional invitation begins a small day of shared activities.',
      actionLabel: 'Start the day',
    },
    invitationMessage: {
      sender: 'Demo Companion',
      text: 'This is a fictional invitation to Lantern Cafe.',
      timeLabel: '09:10',
    },
  },
  meeting: {
    date: '2042-04-12',
    transition: {
      eyebrow: '2042.04.12',
      title: 'First Demo Meeting',
      subtitle: 'Lantern Cafe',
    },
    dialogueIntro: [
      { speaker: 'Demo Companion', text: 'Welcome to our entirely fictional cafe.' },
      { speaker: 'Player', text: 'I will bring the two demo drinks to the table.' },
    ],
    dialogueOutro: [
      { speaker: 'Demo Companion', text: 'The table is ready. Shall we visit the park?' },
      { speaker: 'Player', text: 'That sounds like a good next chapter for this demo.' },
    ],
    photo: {
      src: '/campaign/memory-01.svg',
      alt: 'A fictional illustration of two drinks at a cafe table',
      caption: 'Placeholder memory 1: Lantern Cafe',
      date: '2042-04-12',
    },
  },
  outing: {
    date: '2042-05-03',
    transition: {
      eyebrow: '2042.05.03',
      title: 'A Quiet Walk',
      subtitle: 'Demo Park',
    },
    dialogueIntro: [
      { speaker: 'Demo Companion', text: 'The first marker is beside the fountain.' },
      { speaker: 'Player', text: 'I will follow the path rather than rush ahead.' },
    ],
    dialogueMiddle: [
      { speaker: 'Demo Companion', text: 'The lantern overlook is only a short walk away.' },
    ],
    dialogueOutro: [
      { speaker: 'Player', text: 'The short route gave this fictional outing a calm rhythm.' },
    ],
    message: {
      sender: 'Demo Companion',
      text: 'The imaginary park route was a bright little detour.',
      timeLabel: '14:25',
    },
    photo: {
      src: '/campaign/memory-02.svg',
      alt: 'A fictional illustration of a park fountain and two figures',
      caption: 'Placeholder memory 2: Demo Park',
      date: '2042-05-03',
    },
  },
  preparation: {
    date: '2042-06-14',
    transition: {
      eyebrow: '2042.06.14',
      title: 'Getting Ready',
      subtitle: 'Preparation Space',
    },
    dialogueIntro: [
      { speaker: 'Demo Companion', text: 'Two placeholder items need a quick preparation.' },
      { speaker: 'Player', text: 'I will process each one, then move both to the table.' },
    ],
    dialogueReady: [
      { speaker: 'Demo Companion', text: 'Both items are prepared and ready to carry.' },
    ],
    dialogueOutro: [
      { speaker: 'Player', text: 'Everything is ready for the fictional viewpoint.' },
    ],
    message: {
      sender: 'Demo Companion',
      text: 'Our placeholder picnic pieces are ready for the next stop.',
      timeLabel: '16:40',
    },
    photo: {
      src: '/campaign/memory-03.svg',
      alt: 'A fictional illustration of prepared picnic items',
      caption: 'Placeholder memory 3: Preparation Space',
      date: '2042-06-14',
    },
  },
  journey: {
    date: '2042-07-05',
    transition: {
      eyebrow: '2042.07.05',
      title: 'A Small Journey',
      subtitle: 'Demo Viewpoint',
    },
    dialogueIntro: [
      { speaker: 'Demo Companion', text: 'Let us combine the two components at the blue station.' },
      { speaker: 'Player', text: 'Then I will deliver the finished bundle to the overlook.' },
    ],
    dialogueReady: [
      { speaker: 'Demo Companion', text: 'The finished bundle is waiting on the station.' },
    ],
    dialogueOutro: [
      { speaker: 'Demo Companion', text: 'One quiet room remains for the campaign finale.' },
    ],
    photo: {
      src: '/campaign/memory-04.svg',
      alt: 'A fictional illustration of a blue bundle at a viewpoint',
      caption: 'Placeholder memory 4: Demo Viewpoint',
      date: '2042-07-05',
    },
  },
  ending: {
    date: '2042-08-09',
    transition: {
      eyebrow: '2042.08.09',
      title: 'One Last Memory',
    },
    card: {
      appLabel: 'Keepsake',
      title: 'Five demo memories saved',
      subtitle: 'Fictional campaign complete',
      body: 'The placeholder album now holds every moment from this imaginary journey.',
      actionLabel: 'View the finale',
    },
    dialogueIntro: [
      { speaker: 'Demo Companion', text: 'The placeholder album now shows our whole demo route.' },
      { speaker: 'Player', text: 'Every mechanic became one continuous fictional journey.' },
    ],
    dialogueFinal: [
      { speaker: 'Demo Companion', text: 'This fictional skeleton is ready for pacing feedback.' },
      { speaker: 'Player', text: 'The real story can remain private until a later phase.' },
    ],
    message: {
      sender: 'Demo Companion',
      text: 'Thanks for completing this entirely fictional campaign skeleton.',
      timeLabel: '20:15',
    },
    photo: {
      src: '/campaign/ending.svg',
      alt: 'A fictional illustration of five collected campaign memories',
      caption: 'Placeholder finale: Campaign complete',
      date: '2042-08-09',
    },
    completionSpeech: 'Fictional campaign complete!',
    resumeSpeech: 'Welcome back to the completed fictional campaign.',
  },
} as const satisfies CampaignStoryDefinition;
