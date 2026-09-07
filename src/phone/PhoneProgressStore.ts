import type { PhoneContentRegistry } from './PhoneContentRegistry';
import {
  createEmptyPhoneProgressSnapshot,
  parsePhoneProgressSnapshot,
} from './PhoneProgressValidation';
import type { PhoneProgressSnapshot } from './PhoneTypes';

const STORAGE_KEY = 'ur-game:phone-progress:v1';

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
        return createEmptyPhoneProgressSnapshot();
      }

      const parsed: unknown = JSON.parse(serialized);
      const snapshot = parsePhoneProgressSnapshot(parsed, registry, 'filter');
      if (snapshot === null) {
        this.warnOnce('Saved phone progress is invalid. Using an empty state.');
        return createEmptyPhoneProgressSnapshot();
      }
      return snapshot;
    } catch (error: unknown) {
      this.warnOnce('Phone progress could not be loaded. Using an empty state.', error);
      return createEmptyPhoneProgressSnapshot();
    }
  }

  public save(snapshot: PhoneProgressSnapshot): void {
    try {
      this.storageProvider()?.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (error: unknown) {
      this.warnOnce('Phone progress could not be saved.', error);
    }
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
