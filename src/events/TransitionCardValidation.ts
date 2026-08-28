import type { TransitionCardDefinition } from './EventTypes';

export function assertValidTransitionCardDefinition(
  card: TransitionCardDefinition,
  label: string,
): void {
  assertNonEmpty(card.id, `${label} ID`);
  assertNonEmpty(card.title, `${label} title`);
  if (card.eyebrow !== undefined) {
    assertNonEmpty(card.eyebrow, `${label} eyebrow`);
  }
  if (card.subtitle !== undefined) {
    assertNonEmpty(card.subtitle, `${label} subtitle`);
  }
  if (!Number.isFinite(card.durationSeconds) || card.durationSeconds <= 0) {
    throw new Error(`${label} duration must be a finite positive number.`);
  }
}

function assertNonEmpty(value: string, label: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}
