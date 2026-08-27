import type { PhoneStoryCard } from '../../phone/PhoneTypes';

export const CAMPAIGN_CONNECTION_CARD = {
  id: 'campaign-connection-card',
  appLabel: 'Daylight',
  title: 'A new fictional connection',
  subtitle: 'Demo Companion',
  body: 'A cheerful hello is waiting in this placeholder story.',
  actionLabel: 'Read hello',
} as const satisfies PhoneStoryCard;

export const CAMPAIGN_INVITATION_CARD = {
  id: 'campaign-invitation-card',
  appLabel: 'Daylight',
  title: 'Meet at Lantern Cafe?',
  subtitle: 'Demo Companion',
  body: 'This fictional invitation begins a small day of shared activities.',
  actionLabel: 'Start the day',
} as const satisfies PhoneStoryCard;

export const CAMPAIGN_ENDING_CARD = {
  id: 'campaign-ending-card',
  appLabel: 'Keepsake',
  title: 'Five demo memories saved',
  subtitle: 'Fictional campaign complete',
  body: 'The placeholder album now holds every moment from this imaginary journey.',
  actionLabel: 'View the finale',
} as const satisfies PhoneStoryCard;
