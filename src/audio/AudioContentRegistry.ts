import type {
  AudioClipDefinition,
  AudioClipKind,
  AudioContentDefinition,
} from './AudioTypes';

export class AudioContentRegistry {
  private readonly clips = new Map<string, AudioClipDefinition>();

  public constructor(definition: AudioContentDefinition) {
    if (!Array.isArray(definition.clips)) {
      throw new Error('Audio content clips must be an array.');
    }

    for (const clip of definition.clips) {
      this.validateClip(clip);
      if (this.clips.has(clip.id)) {
        throw new Error(`Duplicate Audio Clip ID "${clip.id}".`);
      }
      this.clips.set(clip.id, clip);
    }
  }

  public getClip(audioId: string): AudioClipDefinition | undefined {
    return this.clips.get(audioId);
  }

  public requireClip(audioId: string, expectedKind: AudioClipKind): AudioClipDefinition {
    const clip = this.getClip(audioId);
    if (clip === undefined) {
      throw new Error(`Audio Clip "${audioId}" is not registered.`);
    }
    if (clip.kind !== expectedKind) {
      throw new Error(
        `Audio Clip "${audioId}" is ${clip.kind}, but ${expectedKind} was requested.`,
      );
    }
    return clip;
  }

  private validateClip(clip: AudioClipDefinition): void {
    this.assertNonEmpty(clip.id, 'Audio Clip ID');
    this.assertNonEmpty(clip.src, `Audio Clip "${clip.id}" source`);
    if (!clip.src.startsWith('/') || clip.src.startsWith('//')) {
      throw new Error(`Audio Clip "${clip.id}" source must be a repository-local path.`);
    }
    if (clip.kind !== 'bgm' && clip.kind !== 'sfx') {
      throw new Error(`Audio Clip "${clip.id}" has an unsupported kind.`);
    }
    if (!Number.isFinite(clip.volume) || clip.volume < 0 || clip.volume > 1) {
      throw new Error(`Audio Clip "${clip.id}" volume must be between 0 and 1.`);
    }
    if (clip.loop !== undefined && typeof clip.loop !== 'boolean') {
      throw new Error(`Audio Clip "${clip.id}" loop must be a boolean when provided.`);
    }
  }

  private assertNonEmpty(value: string, label: string): void {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`${label} must be a non-empty string.`);
    }
  }
}
