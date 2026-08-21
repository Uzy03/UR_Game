import type { InputSource, MovementInput } from './InputSource';

const MOVEMENT_CODES = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD']);

export class KeyboardInput implements InputSource {
  private readonly pressedCodes = new Set<string>();
  private readonly movement: { x: number; y: number } = { x: 0, y: 0 };

  public constructor(private readonly eventTarget: Window) {
    eventTarget.addEventListener('keydown', this.onKeyDown);
    eventTarget.addEventListener('keyup', this.onKeyUp);
    eventTarget.addEventListener('blur', this.onBlur);
  }

  public update(): void {
    this.movement.x = Number(this.pressedCodes.has('KeyD')) - Number(this.pressedCodes.has('KeyA'));
    this.movement.y = Number(this.pressedCodes.has('KeyS')) - Number(this.pressedCodes.has('KeyW'));
  }

  public getMovement(): MovementInput {
    return this.movement;
  }

  public dispose(): void {
    this.eventTarget.removeEventListener('keydown', this.onKeyDown);
    this.eventTarget.removeEventListener('keyup', this.onKeyUp);
    this.eventTarget.removeEventListener('blur', this.onBlur);
    this.pressedCodes.clear();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!MOVEMENT_CODES.has(event.code)) {
      return;
    }

    event.preventDefault();
    this.pressedCodes.add(event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    if (!MOVEMENT_CODES.has(event.code)) {
      return;
    }

    event.preventDefault();
    this.pressedCodes.delete(event.code);
  };

  private readonly onBlur = (): void => {
    this.pressedCodes.clear();
  };
}
