import type { InputSource, MovementInput } from './InputSource';

const MAX_MOVEMENT_LENGTH = 1;

export class InputManager {
  private readonly movement: { x: number; y: number } = { x: 0, y: 0 };

  public constructor(private readonly sources: readonly InputSource[]) {}

  public update(): void {
    let x = 0;
    let y = 0;

    for (const source of this.sources) {
      source.update();
      const sourceMovement = source.getMovement();
      x += sourceMovement.x;
      y += sourceMovement.y;
    }

    const length = Math.hypot(x, y);
    if (length > MAX_MOVEMENT_LENGTH) {
      x /= length;
      y /= length;
    }

    this.movement.x = x;
    this.movement.y = y;
  }

  public getMovement(): MovementInput {
    return this.movement;
  }

  public dispose(): void {
    for (const source of this.sources) {
      source.dispose();
    }
  }
}
