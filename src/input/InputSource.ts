import type { InputAction } from './InputAction';

export interface MovementInput {
  readonly x: number;
  readonly y: number;
}

export interface InputSource {
  update(): void;
  getMovement(): MovementInput;
  isActionPressed(action: InputAction): boolean;
  wasActionPressed(action: InputAction): boolean;
  dispose(): void;
}
