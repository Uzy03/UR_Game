import type { PhoneStoryCard } from '../../phone/PhoneTypes';

export const PHASE7_MATCH_CARD = {
  id: 'demo-match-card',
  appLabel: 'PairUp',
  title: "It's a Match!",
  subtitle: 'Demo Partner',
  body: 'A fictional new connection is waiting for you.',
  actionLabel: 'View Match',
} as const satisfies PhoneStoryCard;

export const PHASE7_INVITATION_CARD = {
  id: 'demo-invitation-card',
  appLabel: 'PairUp',
  title: 'A new invitation',
  subtitle: 'Demo Partner',
  body: 'Would you like to meet for coffee at the demo cafe?',
  actionLabel: 'Sounds good',
} as const satisfies PhoneStoryCard;
