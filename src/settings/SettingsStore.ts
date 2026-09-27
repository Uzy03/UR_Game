export const SETTINGS_STORAGE_KEY = 'ur-game:settings:v1';

export interface SettingsDataV1 {
  readonly version: 1;
  readonly masterVolume: number;
  readonly bgmVolume: number;
  readonly sfxVolume: number;
  readonly muted: boolean;
}

export const DEFAULT_SETTINGS: SettingsDataV1 = {
  version: 1,
  masterVolume: 1,
  bgmVolume: 1,
  sfxVolume: 1,
  muted: false,
};

export type SettingsStorageProvider = () => Storage | null;

export function parseSettings(value: unknown): SettingsDataV1 | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (
    Object.keys(data).length !== 5
    || data.version !== 1
    || typeof data.muted !== 'boolean'
    || !(['masterVolume', 'bgmVolume', 'sfxVolume'] as const).every(
      (key) => typeof data[key] === 'number'
        && Number.isFinite(data[key])
        && (data[key] as number) >= 0
        && (data[key] as number) <= 1,
    )
  ) return null;
  return {
    version: 1,
    masterVolume: data.masterVolume as number,
    bgmVolume: data.bgmVolume as number,
    sfxVolume: data.sfxVolume as number,
    muted: data.muted,
  };
}

export class SettingsStore {
  public constructor(
    private readonly storageProvider: SettingsStorageProvider = () => window.localStorage,
  ) {}

  public load(): SettingsDataV1 {
    try {
      const serialized = this.storageProvider()?.getItem(SETTINGS_STORAGE_KEY);
      return serialized === null || serialized === undefined
        ? { ...DEFAULT_SETTINGS }
        : parseSettings(JSON.parse(serialized)) ?? { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  public save(settings: SettingsDataV1): void {
    if (parseSettings(settings) === null) throw new Error('Invalid settings data.');
    try {
      this.storageProvider()?.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage may be disabled; the current session still uses the setting.
    }
  }
}
