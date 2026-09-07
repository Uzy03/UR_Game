export interface PlanarVector {
  readonly x: number;
  readonly z: number;
}

export interface MutablePlanarVector {
  x: number;
  z: number;
}

const DIRECTION_EPSILON_SQUARED = 0.000001;

export function stepPlanarVelocity(
  current: MutablePlanarVector,
  input: PlanarVector,
  speed: number,
  acceleration: number,
  deceleration: number,
  deltaSeconds: number,
): MutablePlanarVector {
  const safeDelta = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0;
  const inputLength = Math.hypot(input.x, input.z);
  const inputScale = inputLength > 1 ? 1 / inputLength : 1;
  const targetX = input.x * inputScale * speed;
  const targetZ = input.z * inputScale * speed;
  const targetLengthSquared = targetX * targetX + targetZ * targetZ;
  const currentLengthSquared = current.x * current.x + current.z * current.z;
  const reversing = (
    targetLengthSquared > DIRECTION_EPSILON_SQUARED
    && currentLengthSquared > DIRECTION_EPSILON_SQUARED
    && current.x * targetX + current.z * targetZ < 0
  );
  const rate = targetLengthSquared <= DIRECTION_EPSILON_SQUARED || reversing
    ? deceleration
    : acceleration;

  const offsetX = targetX - current.x;
  const offsetZ = targetZ - current.z;
  const distance = Math.hypot(offsetX, offsetZ);
  const maximumStep = Math.max(0, rate) * safeDelta;
  if (distance <= maximumStep || distance <= Number.EPSILON) {
    current.x = targetX;
    current.z = targetZ;
    return current;
  }

  const scale = maximumStep / distance;
  current.x += offsetX * scale;
  current.z += offsetZ * scale;
  return current;
}
