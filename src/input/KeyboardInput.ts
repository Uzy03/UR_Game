import type { InputSource, MovementInput } from './InputSource';
import { InputAction } from './InputAction';

const MOVEMENT_CODES = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD']);
const MIN_MOVEMENT_TAP_MILLISECONDS = 80;
const ACTION_BY_CODE = new Map<string, InputAction>([
  ['KeyE', InputAction.Interact],
  ['Space', InputAction.Interact],
  ['KeyR', InputAction.Retry],
]);
const HANDLED_CODES = new Set([...MOVEMENT_CODES, ...ACTION_BY_CODE.keys()]);

export class KeyboardInput implements InputSource {
  private readonly pressedCodes = new Set<string>();
  private readonly movementActiveUntil = new Map<string, number>();
  private readonly pendingActionPresses = new Set<InputAction>();
  private readonly frameActionPresses = new Set<InputAction>();
  private readonly movement: { x: number; y: number } = { x: 0, y: 0 };

  public constructor(private readonly eventTarget: Window) {
    eventTarget.addEventListener('keydown', this.onKeyDown);
    eventTarget.addEventListener('keyup', this.onKeyUp);
    eventTarget.addEventListener('blur', this.onBlur);
  }

  public update(): void {
    const now = performance.now();
    this.movement.x = (
      Number(this.isMovementCodeActive('KeyD', now))
      - Number(this.isMovementCodeActive('KeyA', now))
    );
    this.movement.y = (
      Number(this.isMovementCodeActive('KeyS', now))
      - Number(this.isMovementCodeActive('KeyW', now))
    );

    this.frameActionPresses.clear();
    for (const action of this.pendingActionPresses) {
      this.frameActionPresses.add(action);
    }
    this.pendingActionPresses.clear();
  }

  public getMovement(): MovementInput {
    return this.movement;
  }

  public isActionPressed(action: InputAction): boolean {
    for (const code of this.pressedCodes) {
      if (ACTION_BY_CODE.get(code) === action) {
        return true;
      }
    }

    return false;
  }

  public wasActionPressed(action: InputAction): boolean {
    return this.frameActionPresses.has(action);
  }

  public dispose(): void {
    this.eventTarget.removeEventListener('keydown', this.onKeyDown);
    this.eventTarget.removeEventListener('keyup', this.onKeyUp);
    this.eventTarget.removeEventListener('blur', this.onBlur);
    this.pressedCodes.clear();
    this.movementActiveUntil.clear();
    this.pendingActionPresses.clear();
    this.frameActionPresses.clear();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!HANDLED_CODES.has(event.code)) {
      return;
    }

    event.preventDefault();

    if (!this.pressedCodes.has(event.code)) {
      const action = ACTION_BY_CODE.get(event.code);
      if (action !== undefined) {
        this.pendingActionPresses.add(action);
      }
      if (MOVEMENT_CODES.has(event.code)) {
        this.movementActiveUntil.set(
          event.code,
          performance.now() + MIN_MOVEMENT_TAP_MILLISECONDS,
        );
      }
    }
    this.pressedCodes.add(event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    if (!HANDLED_CODES.has(event.code)) {
      return;
    }

    event.preventDefault();
    this.pressedCodes.delete(event.code);
  };

  private readonly onBlur = (): void => {
    this.pressedCodes.clear();
    this.movementActiveUntil.clear();
    this.pendingActionPresses.clear();
    this.frameActionPresses.clear();
  };

  private isMovementCodeActive(code: string, now: number): boolean {
    if (this.pressedCodes.has(code)) {
      return true;
    }

    const activeUntil = this.movementActiveUntil.get(code);
    if (activeUntil === undefined) {
      return false;
    }
    if (activeUntil > now) {
      return true;
    }

    this.movementActiveUntil.delete(code);
    return false;
  }
}
