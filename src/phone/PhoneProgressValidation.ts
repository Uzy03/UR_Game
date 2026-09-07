import type { PhoneContentRegistry } from './PhoneContentRegistry';
import type { PhoneObjective, PhoneProgressSnapshot } from './PhoneTypes';

export const PHONE_PROGRESS_VERSION = 1;

export type UnknownPhoneContentPolicy = 'filter' | 'reject';

export function createEmptyPhoneProgressSnapshot(): PhoneProgressSnapshot {
  return {
    version: PHONE_PROGRESS_VERSION,
    storyDate: null,
    currentObjective: null,
    unlockedMessageIds: [],
    unlockedPhotoIds: [],
  };
}

export function parsePhoneProgressSnapshot(
  value: unknown,
  registry: PhoneContentRegistry,
  unknownContentPolicy: UnknownPhoneContentPolicy,
): PhoneProgressSnapshot | null {
  if (!isRecord(value) || value.version !== PHONE_PROGRESS_VERSION) {
    return null;
  }
  if (value.storyDate !== null && !isValidStoryDate(value.storyDate)) {
    return null;
  }
  if (!isValidPhoneObjective(value.currentObjective)) {
    return null;
  }
  if (!isStringArray(value.unlockedMessageIds) || !isStringArray(value.unlockedPhotoIds)) {
    return null;
  }

  const messageIds = [...new Set(value.unlockedMessageIds)];
  const photoIds = [...new Set(value.unlockedPhotoIds)];
  if (
    unknownContentPolicy === 'reject'
    && (
      messageIds.some((id) => registry.getMessage(id) === undefined)
      || photoIds.some((id) => registry.getPhoto(id) === undefined)
    )
  ) {
    return null;
  }

  return {
    version: PHONE_PROGRESS_VERSION,
    storyDate: value.storyDate,
    currentObjective: value.currentObjective === null
      ? null
      : { id: value.currentObjective.id, text: value.currentObjective.text },
    unlockedMessageIds: unknownContentPolicy === 'filter'
      ? messageIds.filter((id) => registry.getMessage(id) !== undefined)
      : messageIds,
    unlockedPhotoIds: unknownContentPolicy === 'filter'
      ? photoIds.filter((id) => registry.getPhoto(id) !== undefined)
      : photoIds,
  };
}

export function isValidPhoneObjective(value: unknown): value is PhoneObjective | null {
  return value === null
    || (
      isRecord(value)
      && typeof value.id === 'string'
      && value.id.trim().length > 0
      && typeof value.text === 'string'
      && value.text.trim().length > 0
    );
}

export function isValidStoryDate(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
