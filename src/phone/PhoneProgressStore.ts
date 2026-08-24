import type { PhoneContentRegistry } from './PhoneContentRegistry';
import type { PhoneObjective, PhoneProgressSnapshot } from './PhoneTypes';

const STORAGE_KEY = 'ur-game:phone-progress:v1';
const SNAPSHOT_VERSION = 1;

type StorageProvider = () => Storage | null;

export class PhoneProgressStore {
  private hasWarned = false;

  public constructor(
    private readonly storageProvider: StorageProvider = () => window.localStorage,
  ) {}

  public load(registry: PhoneContentRegistry): PhoneProgressSnapshot {
    try {
      const storage = this.storageProvider();
      const serialized = storage?.getItem(STORAGE_KEY);
      if (serialized === null || serialized === undefined) {
        return this.createEmptySnapshot();
      }

      const parsed: unknown = JSON.parse(serialized);
      const snapshot = this.parseSnapshot(parsed, registry);
      if (snapshot === null) {
        this.warnOnce('Saved phone progress is invalid. Using an empty state.');
        return this.createEmptySnapshot();
      }
      return snapshot;
    } catch (error: unknown) {
      this.warnOnce('Phone progress could not be loaded. Using an empty state.', error);
      return this.createEmptySnapshot();
    }
  }

  public save(snapshot: PhoneProgressSnapshot): void {
    try {
      this.storageProvider()?.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (error: unknown) {
      this.warnOnce('Phone progress could not be saved.', error);
    }
  }

  private parseSnapshot(
    value: unknown,
    registry: PhoneContentRegistry,
  ): PhoneProgressSnapshot | null {
    if (!this.isRecord(value) || value.version !== SNAPSHOT_VERSION) {
      return null;
    }
    if (value.storyDate !== null && !this.isValidStoryDate(value.storyDate)) {
      return null;
    }
    if (!this.isValidObjective(value.currentObjective)) {
      return null;
    }
    if (!this.isStringArray(value.unlockedMessageIds)) {
      return null;
    }
    if (!this.isStringArray(value.unlockedPhotoIds)) {
      return null;
    }

    return {
      version: SNAPSHOT_VERSION,
      storyDate: value.storyDate,
      currentObjective: value.currentObjective === null
        ? null
        : { id: value.currentObjective.id, text: value.currentObjective.text },
      unlockedMessageIds: [...new Set(value.unlockedMessageIds)].filter(
        (id) => registry.getMessage(id) !== undefined,
      ),
      unlockedPhotoIds: [...new Set(value.unlockedPhotoIds)].filter(
        (id) => registry.getPhoto(id) !== undefined,
      ),
    };
  }

  private createEmptySnapshot(): PhoneProgressSnapshot {
    return {
      version: SNAPSHOT_VERSION,
      storyDate: null,
      currentObjective: null,
      unlockedMessageIds: [],
      unlockedPhotoIds: [],
    };
  }

  private isValidObjective(value: unknown): value is PhoneObjective | null {
    return value === null
      || (
        this.isRecord(value)
        && typeof value.id === 'string'
        && value.id.trim().length > 0
        && typeof value.text === 'string'
        && value.text.trim().length > 0
      );
  }

  private isValidStoryDate(value: unknown): value is string {
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

  private isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private warnOnce(message: string, error?: unknown): void {
    if (this.hasWarned) {
      return;
    }
    this.hasWarned = true;
    if (error === undefined) {
      console.warn(`[PhoneProgressStore] ${message}`);
    } else {
      console.warn(`[PhoneProgressStore] ${message}`, error);
    }
  }
}
