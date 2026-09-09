import type { WorldRoute } from './WorldRoute';

export const WORLD_PROGRESS_STORAGE_KEY = 'ur-game:world-progress:v1';
export const WORLD_PROGRESS_VERSION = 1;

export interface WorldProgressDataV1 {
  readonly version: 1;
  readonly completedNodeIds: readonly string[];
}

export type WorldProgressStorageProvider = () => Storage | null;

export class WorldProgressStore {
  private hasWarned = false;

  public constructor(
    private readonly storageProvider: WorldProgressStorageProvider = () => window.localStorage,
  ) {}

  public load(route: WorldRoute): WorldProgressDataV1 | null {
    try {
      const serialized = this.storageProvider()?.getItem(WORLD_PROGRESS_STORAGE_KEY);
      if (serialized === null || serialized === undefined) {
        return null;
      }
      const parsed: unknown = JSON.parse(serialized);
      if (!this.isData(parsed, route)) {
        this.warnOnce('Saved World progress is invalid. It will be reconstructed from Checkpoint.');
        return null;
      }
      return {
        version: WORLD_PROGRESS_VERSION,
        completedNodeIds: [...parsed.completedNodeIds],
      };
    } catch (error: unknown) {
      this.warnOnce(
        'World progress could not be loaded. It will be reconstructed from Checkpoint.',
        error,
      );
      return null;
    }
  }

  public save(data: WorldProgressDataV1): void {
    try {
      this.storageProvider()?.setItem(WORLD_PROGRESS_STORAGE_KEY, JSON.stringify(data));
    } catch (error: unknown) {
      this.warnOnce('World progress could not be saved.', error);
    }
  }

  public clear(): void {
    try {
      this.storageProvider()?.removeItem(WORLD_PROGRESS_STORAGE_KEY);
    } catch (error: unknown) {
      this.warnOnce('World progress could not be cleared.', error);
    }
  }

  private isData(value: unknown, route: WorldRoute): value is WorldProgressDataV1 {
    if (
      typeof value !== 'object'
      || value === null
      || Object.keys(value).some(
        (key) => key !== 'version' && key !== 'completedNodeIds',
      )
      || !('version' in value)
      || value.version !== WORLD_PROGRESS_VERSION
      || !('completedNodeIds' in value)
      || !Array.isArray(value.completedNodeIds)
      || !value.completedNodeIds.every((nodeId) => typeof nodeId === 'string')
    ) {
      return false;
    }
    return route.isValidCompletedPrefix(value.completedNodeIds);
  }

  private warnOnce(message: string, error?: unknown): void {
    if (this.hasWarned) {
      return;
    }
    this.hasWarned = true;
    if (error === undefined) {
      console.warn(`[WorldProgressStore] ${message}`);
    } else {
      console.warn(`[WorldProgressStore] ${message}`, error);
    }
  }
}
