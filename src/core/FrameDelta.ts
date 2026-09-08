export function clampFrameDeltaSeconds(
  elapsedSeconds: number,
  maximumSeconds: number,
): number {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) {
    return 0;
  }
  if (!Number.isFinite(maximumSeconds) || maximumSeconds <= 0) {
    return 0;
  }
  return Math.min(elapsedSeconds, maximumSeconds);
}
