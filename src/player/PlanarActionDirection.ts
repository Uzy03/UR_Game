export interface PlanarDirection {
  readonly x: number;
  readonly z: number;
}

export function resolvePlanarActionDirection(
  input: PlanarDirection,
  facingRadians: number,
  inputThreshold: number,
): PlanarDirection {
  const inputLength = Math.hypot(input.x, input.z);
  const safeThreshold = Number.isFinite(inputThreshold) ? Math.max(0, inputThreshold) : 0;
  if (Number.isFinite(inputLength) && inputLength >= safeThreshold && inputLength > 0) {
    return { x: input.x / inputLength, z: input.z / inputLength };
  }

  const safeFacing = Number.isFinite(facingRadians) ? facingRadians : 0;
  return { x: Math.sin(safeFacing), z: Math.cos(safeFacing) };
}
