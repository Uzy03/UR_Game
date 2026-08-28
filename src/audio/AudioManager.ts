import type { AudioActions } from './AudioActions';
import type { AudioContentRegistry } from './AudioContentRegistry';
import type { AudioClipDefinition } from './AudioTypes';

export interface AudioMedia {
  loop: boolean;
  volume: number;
  currentTime: number;
  play(): Promise<void>;
  pause(): void;
  addEventListener(
    type: 'ended',
    listener: EventListener,
    options?: AddEventListenerOptions | boolean,
  ): void;
  removeEventListener(type: 'ended', listener: EventListener): void;
}

interface AudioManagerOptions {
  readonly unlockTarget: EventTarget;
  readonly unlockMedia?: () => Promise<void>;
  readonly createMedia: (src: string) => AudioMedia;
  readonly defaultFadeSeconds: number;
}

interface BgmChannel {
  readonly clip: AudioClipDefinition;
  readonly media: AudioMedia;
  gain: number;
  fadeStartGain: number;
  fadeTargetGain: number;
  fadeElapsedSeconds: number;
  fadeDurationSeconds: number;
}

interface SfxPlayback {
  readonly clip: AudioClipDefinition;
  readonly media: AudioMedia;
  readonly endedHandler: EventListener;
}

interface DesiredBgm {
  readonly audioId: string;
  readonly fadeSeconds: number;
}

export class AudioManager implements AudioActions {
  private readonly bgmChannels = new Set<BgmChannel>();
  private readonly sfxPlaybacks = new Set<SfxPlayback>();
  private desiredBgm: DesiredBgm | null = null;
  private currentBgm: BgmChannel | null = null;
  private muted = false;
  private unlocked = false;
  private unlockListenersArmed = false;
  private disposed = false;

  public constructor(
    private readonly content: AudioContentRegistry,
    private readonly options: AudioManagerOptions,
  ) {
    this.assertFadeDuration(options.defaultFadeSeconds);
    this.armUnlockListeners();
  }

  public get isMuted(): boolean {
    return this.muted;
  }

  public get isAudioUnlocked(): boolean {
    return this.unlocked;
  }

  public get desiredBgmId(): string | null {
    return this.desiredBgm?.audioId ?? null;
  }

  public playBgm(audioId: string, fadeSeconds = this.options.defaultFadeSeconds): void {
    if (this.disposed) {
      return;
    }

    this.content.requireClip(audioId, 'bgm');
    this.assertFadeDuration(fadeSeconds);
    this.desiredBgm = { audioId, fadeSeconds };
    if (this.unlocked) {
      this.startDesiredBgm();
    }
  }

  public stopBgm(fadeSeconds = this.options.defaultFadeSeconds): void {
    if (this.disposed) {
      return;
    }

    this.assertFadeDuration(fadeSeconds);
    this.desiredBgm = null;
    this.currentBgm = null;
    for (const channel of [...this.bgmChannels]) {
      this.setChannelTarget(channel, 0, fadeSeconds);
    }
  }

  public playSfx(audioId: string): void {
    if (this.disposed) {
      return;
    }

    const clip = this.content.requireClip(audioId, 'sfx');
    if (!this.unlocked || this.muted) {
      return;
    }

    const media = this.options.createMedia(clip.src);
    media.loop = clip.loop ?? false;
    media.volume = clip.volume;
    const endedHandler: EventListener = () => this.releaseSfx(playback);
    const playback: SfxPlayback = { clip, media, endedHandler };
    this.sfxPlaybacks.add(playback);
    media.addEventListener('ended', endedHandler, { once: true });
    void media.play().catch(() => this.releaseSfx(playback));
  }

  public setMuted(muted: boolean): void {
    if (this.disposed || muted === this.muted) {
      return;
    }

    this.muted = muted;
    for (const channel of this.bgmChannels) {
      this.applyBgmVolume(channel);
    }
    for (const playback of this.sfxPlaybacks) {
      playback.media.volume = muted ? 0 : playback.clip.volume;
    }
  }

  public toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public update(deltaSeconds: number): void {
    if (this.disposed) {
      return;
    }

    const safeDeltaSeconds = Number.isFinite(deltaSeconds) && deltaSeconds > 0
      ? deltaSeconds
      : 0;
    for (const channel of [...this.bgmChannels]) {
      if (channel.fadeDurationSeconds > 0) {
        channel.fadeElapsedSeconds = Math.min(
          channel.fadeDurationSeconds,
          channel.fadeElapsedSeconds + safeDeltaSeconds,
        );
        const progress = channel.fadeElapsedSeconds / channel.fadeDurationSeconds;
        channel.gain = channel.fadeStartGain
          + (channel.fadeTargetGain - channel.fadeStartGain) * progress;
      } else {
        channel.gain = channel.fadeTargetGain;
      }

      this.applyBgmVolume(channel);
      if (
        channel.fadeTargetGain === 0
        && channel.fadeElapsedSeconds >= channel.fadeDurationSeconds
      ) {
        this.releaseBgmChannel(channel);
      }
    }
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.disarmUnlockListeners();
    this.desiredBgm = null;
    this.currentBgm = null;
    for (const channel of [...this.bgmChannels]) {
      this.releaseBgmChannel(channel);
    }
    for (const playback of [...this.sfxPlaybacks]) {
      this.releaseSfx(playback);
    }
  }

  private startDesiredBgm(): void {
    const desired = this.desiredBgm;
    if (desired === null || !this.unlocked || this.disposed) {
      return;
    }

    const existingChannel = [...this.bgmChannels].find(
      (channel) => channel.clip.id === desired.audioId,
    );
    if (existingChannel !== undefined) {
      this.currentBgm = existingChannel;
      this.setChannelTarget(existingChannel, 1, desired.fadeSeconds);
      for (const channel of [...this.bgmChannels]) {
        if (channel !== existingChannel) {
          this.setChannelTarget(channel, 0, desired.fadeSeconds);
        }
      }
      return;
    }

    const clip = this.content.requireClip(desired.audioId, 'bgm');
    const outgoingChannel = this.currentBgm;
    for (const channel of [...this.bgmChannels]) {
      if (channel === outgoingChannel) {
        this.setChannelTarget(channel, 0, desired.fadeSeconds);
      } else {
        // A rapid second switch must not leave an older fade-out channel alive.
        this.releaseBgmChannel(channel);
      }
    }

    const media = this.options.createMedia(clip.src);
    media.loop = clip.loop ?? true;
    media.volume = 0;
    const channel: BgmChannel = {
      clip,
      media,
      gain: desired.fadeSeconds === 0 ? 1 : 0,
      fadeStartGain: 0,
      fadeTargetGain: 1,
      fadeElapsedSeconds: 0,
      fadeDurationSeconds: desired.fadeSeconds,
    };
    this.bgmChannels.add(channel);
    this.currentBgm = channel;
    this.applyBgmVolume(channel);
    void media.play().catch(() => this.handleBgmPlayFailure(channel));
  }

  private setChannelTarget(channel: BgmChannel, targetGain: number, fadeSeconds: number): void {
    channel.fadeStartGain = channel.gain;
    channel.fadeTargetGain = targetGain;
    channel.fadeElapsedSeconds = 0;
    channel.fadeDurationSeconds = fadeSeconds;
    if (fadeSeconds === 0) {
      channel.gain = targetGain;
      this.applyBgmVolume(channel);
      if (targetGain === 0) {
        this.releaseBgmChannel(channel);
      }
    }
  }

  private handleBgmPlayFailure(channel: BgmChannel): void {
    if (!this.bgmChannels.has(channel) || this.disposed) {
      return;
    }

    this.releaseBgmChannel(channel);
    this.unlocked = false;
    this.armUnlockListeners();
  }

  private releaseBgmChannel(channel: BgmChannel): void {
    if (!this.bgmChannels.delete(channel)) {
      return;
    }
    channel.media.pause();
    channel.media.currentTime = 0;
    if (this.currentBgm === channel) {
      this.currentBgm = null;
    }
  }

  private releaseSfx(playback: SfxPlayback): void {
    if (!this.sfxPlaybacks.delete(playback)) {
      return;
    }
    playback.media.removeEventListener('ended', playback.endedHandler);
    playback.media.pause();
    playback.media.currentTime = 0;
  }

  private applyBgmVolume(channel: BgmChannel): void {
    channel.media.volume = this.muted ? 0 : channel.clip.volume * channel.gain;
  }

  private armUnlockListeners(): void {
    if (this.unlockListenersArmed || this.disposed) {
      return;
    }
    this.unlockListenersArmed = true;
    this.options.unlockTarget.addEventListener('pointerdown', this.handleAudioUnlock, {
      capture: true,
      once: true,
    });
    this.options.unlockTarget.addEventListener('keydown', this.handleAudioUnlock, {
      capture: true,
      once: true,
    });
  }

  private disarmUnlockListeners(): void {
    if (!this.unlockListenersArmed) {
      return;
    }
    this.unlockListenersArmed = false;
    this.options.unlockTarget.removeEventListener('pointerdown', this.handleAudioUnlock, true);
    this.options.unlockTarget.removeEventListener('keydown', this.handleAudioUnlock, true);
  }

  private readonly handleAudioUnlock: EventListener = (): void => {
    if (this.disposed) {
      return;
    }
    this.disarmUnlockListeners();
    const unlockMedia = this.options.unlockMedia;
    if (unlockMedia === undefined) {
      this.completeMediaUnlock();
      return;
    }
    try {
      void unlockMedia()
        .then(this.completeMediaUnlock)
        .catch(this.handleMediaUnlockFailure);
    } catch {
      this.handleMediaUnlockFailure();
    }
  };

  private readonly completeMediaUnlock = (): void => {
    if (this.disposed) {
      return;
    }
    this.unlocked = true;
    this.startDesiredBgm();
  };

  private readonly handleMediaUnlockFailure = (): void => {
    if (this.disposed) {
      return;
    }
    this.unlocked = false;
    this.armUnlockListeners();
  };

  private assertFadeDuration(value: number): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error('Audio fade duration must be a finite non-negative number.');
    }
  }
}
