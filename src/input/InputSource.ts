export interface MovementInput {
  readonly x: number;
  readonly y: number;
}

export interface InputSource {
  update(): void;
  getMovement(): MovementInput;
  dispose(): void;
}
