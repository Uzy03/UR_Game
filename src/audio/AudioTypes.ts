export type AudioClipKind = 'bgm' | 'sfx';

export interface AudioClipDefinition {
  readonly id: string;
  readonly src: string;
  readonly kind: AudioClipKind;
  readonly volume: number;
  readonly loop?: boolean;
}

export interface AudioContentDefinition {
  readonly clips: readonly AudioClipDefinition[];
}

export type AudioCue =
  | {
      readonly kind: 'play_bgm';
      readonly audioId: string;
      readonly fadeSeconds?: number;
    }
  | {
      readonly kind: 'stop_bgm';
      readonly fadeSeconds?: number;
    }
  | {
      readonly kind: 'play_sfx';
      readonly audioId: string;
    };
