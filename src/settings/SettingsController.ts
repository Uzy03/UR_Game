import type { AudioManager } from '../audio/AudioManager';
import type { AudioMuteButton } from '../ui/AudioMuteButton';
import { SettingsStore, type SettingsDataV1 } from './SettingsStore';

export type VolumeSetting = 'masterVolume' | 'bgmVolume' | 'sfxVolume';

export class SettingsController {
  private settings: SettingsDataV1;
  private readonly listeners = new Set<(settings: SettingsDataV1) => void>();

  public constructor(
    private readonly audio: AudioManager,
    private readonly muteButton: AudioMuteButton,
    private readonly store: SettingsStore = new SettingsStore(),
  ) {
    this.settings = store.load();
    this.apply();
    muteButton.setToggleHandler(() => this.setMuted(!this.settings.muted));
  }

  public get snapshot(): SettingsDataV1 { return { ...this.settings }; }

  public setVolume(key: VolumeSetting, value: number): void {
    if (!Number.isFinite(value)) return;
    this.settings = { ...this.settings, [key]: Math.max(0, Math.min(1, value)) };
    this.apply();
  }

  public setMuted(muted: boolean): void {
    this.settings = { ...this.settings, muted };
    this.apply();
  }

  public subscribe(listener: (settings: SettingsDataV1) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private apply(): void {
    this.audio.setVolumeLevels(
      this.settings.masterVolume,
      this.settings.bgmVolume,
      this.settings.sfxVolume,
    );
    this.audio.setMuted(this.settings.muted);
    this.muteButton.setMuted(this.settings.muted);
    this.store.save(this.settings);
    for (const listener of this.listeners) listener(this.snapshot);
  }
}
