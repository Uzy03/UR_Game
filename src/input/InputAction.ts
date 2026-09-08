export enum InputAction {
  Interact = 'interact',
  Dash = 'dash',
  Throw = 'throw',
  Retry = 'retry',
  Phone = 'phone',
  Back = 'back',
}

export const INPUT_ACTIONS: readonly InputAction[] = [
  InputAction.Interact,
  InputAction.Dash,
  InputAction.Throw,
  InputAction.Retry,
  InputAction.Phone,
  InputAction.Back,
];
