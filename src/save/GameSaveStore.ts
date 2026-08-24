import type { GameSaveDataV1 } from './GameSaveTypes';

const STORAGE_KEY = 'ur-game:save:v1';
const SAVE_VERSION = 1;

export type GameSaveStorageProvider = () => Storage | null;

export class GameSaveStore {
  private hasWarned = false;

  public constructor(
    private readonly storageProvider: GameSaveStorageProvider = () => window.localStorage,
  ) {}

  public load(): GameSaveDataV1 | null {
    try {
      const serialized = this.storageProvider()?.getItem(STORAGE_KEY);
      if (serialized === null || serialized === undefined) {
        return null;
      }

      const parsed: unknown = JSON.parse(serialized);
      if (!this.isSaveData(parsed)) {
        this.warnOnce('Saved game progress is invalid. Continue is unavailable.');
        return null;
      }
      return { version: SAVE_VERSION, checkpointId: parsed.checkpointId };
    } catch (error: unknown) {
      this.warnOnce('Game progress could not be loaded. Continue is unavailable.', error);
      return null;
    }
  }

  public save(data: GameSaveDataV1): void {
    try {
      this.storageProvider()?.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error: unknown) {
      this.warnOnce('Game progress could not be saved.', error);
    }
  }

  public clear(): void {
    try {
      this.storageProvider()?.removeItem(STORAGE_KEY);
    } catch (error: unknown) {
      this.warnOnce('Game progress could not be cleared.', error);
    }
  }

  private isSaveData(value: unknown): value is GameSaveDataV1 {
    return this.isRecord(value)
      && value.version === SAVE_VERSION
      && typeof value.checkpointId === 'string'
      && value.checkpointId.trim().length > 0;
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
      console.warn(`[GameSaveStore] ${message}`);
    } else {
      console.warn(`[GameSaveStore] ${message}`, error);
    }
  }
}
