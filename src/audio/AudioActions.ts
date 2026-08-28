export interface AudioActions {
  playBgm(audioId: string, fadeSeconds?: number): void;
  stopBgm(fadeSeconds?: number): void;
  playSfx(audioId: string): void;
}
