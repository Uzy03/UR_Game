import type { AudioContentRegistry } from './AudioContentRegistry';
import type { AudioCue } from './AudioTypes';

export function assertValidAudioCue(
  cue: AudioCue,
  audioContent: AudioContentRegistry,
  label: string,
): void {
  switch (cue.kind) {
    case 'play_bgm':
      assertNonEmpty(cue.audioId, `${label} BGM ID`);
      audioContent.requireClip(cue.audioId, 'bgm');
      assertOptionalFade(cue.fadeSeconds, label);
      break;
    case 'stop_bgm':
      assertOptionalFade(cue.fadeSeconds, label);
      break;
    case 'play_sfx':
      assertNonEmpty(cue.audioId, `${label} SFX ID`);
      audioContent.requireClip(cue.audioId, 'sfx');
      break;
    default: {
      const unsupported = cue as { readonly kind?: unknown };
      throw new Error(`${label} has unsupported kind "${String(unsupported.kind)}".`);
    }
  }
}

function assertOptionalFade(fadeSeconds: number | undefined, label: string): void {
  if (fadeSeconds !== undefined && (!Number.isFinite(fadeSeconds) || fadeSeconds < 0)) {
    throw new Error(`${label} fade duration must be a finite non-negative number.`);
  }
}

function assertNonEmpty(value: string, label: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}
