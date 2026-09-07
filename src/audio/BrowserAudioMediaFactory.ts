import type { AudioMedia } from './AudioManager';

export class BrowserAudioMediaFactory {
  private readonly bufferCache = new Map<string, Promise<AudioBuffer>>();
  private readonly media = new Set<BrowserAudioMedia>();
  private context: AudioContext | null = null;
  private disposed = false;

  public create(src: string): AudioMedia {
    if (this.disposed) {
      throw new Error('Browser audio media factory is disposed.');
    }

    const media = new BrowserAudioMedia(this, src);
    this.media.add(media);
    return media;
  }

  public unlock(): Promise<void> {
    return this.getContext().resume();
  }

  public getContext(): AudioContext {
    if (this.disposed) {
      throw new Error('Browser audio media factory is disposed.');
    }
    this.context ??= new AudioContext();
    return this.context;
  }

  public loadBuffer(src: string, context: AudioContext): Promise<AudioBuffer> {
    const cached = this.bufferCache.get(src);
    if (cached !== undefined) {
      return cached;
    }

    const loading = fetch(src)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Audio asset request failed with status ${response.status}.`);
        }
        return response.arrayBuffer();
      })
      .then((data) => context.decodeAudioData(data))
      .catch((error: unknown) => {
        this.bufferCache.delete(src);
        throw error;
      });
    this.bufferCache.set(src, loading);
    return loading;
  }

  public release(media: BrowserAudioMedia): void {
    this.media.delete(media);
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    for (const media of [...this.media]) {
      media.pause();
    }
    this.bufferCache.clear();
    const context = this.context;
    this.context = null;
    if (context !== null && context.state !== 'closed') {
      void context.close().catch(() => {
        // Disposal remains best-effort when the browser is already tearing down audio.
      });
    }
  }
}

class BrowserAudioMedia implements AudioMedia {
  private readonly events = new EventTarget();
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private playPromise: Promise<void> | null = null;
  private playToken = 0;
  private loopValue = false;
  private volumeValue = 1;
  private startOffsetSeconds = 0;
  private disposed = false;

  public constructor(
    private readonly owner: BrowserAudioMediaFactory,
    private readonly src: string,
  ) {}

  public get loop(): boolean {
    return this.loopValue;
  }

  public set loop(loop: boolean) {
    this.loopValue = loop;
    if (this.source !== null) {
      this.source.loop = loop;
    }
  }

  public get volume(): number {
    return this.volumeValue;
  }

  public set volume(volume: number) {
    this.volumeValue = Math.min(1, Math.max(0, volume));
    if (this.gain !== null) {
      this.gain.gain.value = this.volumeValue;
    }
  }

  public get currentTime(): number {
    return this.startOffsetSeconds;
  }

  public set currentTime(currentTime: number) {
    this.startOffsetSeconds = Number.isFinite(currentTime)
      ? Math.max(0, currentTime)
      : 0;
  }

  public play(): Promise<void> {
    if (this.disposed) {
      return Promise.reject(new Error('Browser audio media is disposed.'));
    }
    this.playPromise ??= this.startPlayback(++this.playToken).catch((error: unknown) => {
      this.playPromise = null;
      throw error;
    });
    return this.playPromise;
  }

  public pause(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.playToken += 1;
    this.disconnectNodes(true);
    this.owner.release(this);
  }

  public addEventListener(
    type: 'ended',
    listener: EventListener,
    options?: AddEventListenerOptions | boolean,
  ): void {
    this.events.addEventListener(type, listener, options);
  }

  public removeEventListener(type: 'ended', listener: EventListener): void {
    this.events.removeEventListener(type, listener);
  }

  private async startPlayback(token: number): Promise<void> {
    const context = this.owner.getContext();
    await context.resume();
    const buffer = await this.owner.loadBuffer(this.src, context);
    if (this.disposed || token !== this.playToken) {
      return;
    }

    const gain = context.createGain();
    gain.gain.value = this.volumeValue;
    gain.connect(context.destination);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = this.loopValue;
    source.connect(gain);
    source.onended = (): void => {
      if (this.source !== source || this.loopValue) {
        return;
      }
      this.disconnectNodes(false);
      this.events.dispatchEvent(new Event('ended'));
    };

    this.gain = gain;
    this.source = source;
    const offset = buffer.duration > 0
      ? this.startOffsetSeconds % buffer.duration
      : 0;
    source.start(0, offset);
  }

  private disconnectNodes(stopSource: boolean): void {
    const source = this.source;
    this.source = null;
    if (source !== null) {
      source.onended = null;
      if (stopSource) {
        try {
          source.stop();
        } catch {
          // The source may already have completed between frames.
        }
      }
      source.disconnect();
    }

    this.gain?.disconnect();
    this.gain = null;
  }
}
