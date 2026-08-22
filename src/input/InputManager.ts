import type { InputSource, MovementInput } from './InputSource';
import { INPUT_ACTIONS, type InputAction } from './InputAction';

const MAX_MOVEMENT_LENGTH = 1;

export class InputManager {
  private readonly movement: { x: number; y: number } = { x: 0, y: 0 };
  private readonly pressedActions = new Set<InputAction>();
  private readonly frameActionPresses = new Set<InputAction>();

  public constructor(private readonly sources: readonly InputSource[]) {}

  public update(): void {
    let x = 0;
    let y = 0;
    this.pressedActions.clear();
    this.frameActionPresses.clear();

    for (const source of this.sources) {
      source.update();
      const sourceMovement = source.getMovement();
      x += sourceMovement.x;
      y += sourceMovement.y;

      for (const action of INPUT_ACTIONS) {
        if (source.isActionPressed(action)) {
          this.pressedActions.add(action);
        }
        if (source.wasActionPressed(action)) {
          this.frameActionPresses.add(action);
        }
      }
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

  public isActionPressed(action: InputAction): boolean {
    return this.pressedActions.has(action);
  }

  public wasActionPressed(action: InputAction): boolean {
    return this.frameActionPresses.has(action);
  }

  public consumeActionPress(action: InputAction): boolean {
    if (!this.frameActionPresses.has(action)) {
      return false;
    }

    this.frameActionPresses.delete(action);
    return true;
  }

  public dispose(): void {
    for (const source of this.sources) {
      source.dispose();
    }
  }
}
