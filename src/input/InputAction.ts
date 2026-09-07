export enum InputAction {
  Interact = 'interact',
  Retry = 'retry',
  Phone = 'phone',
  Back = 'back',
}

export const INPUT_ACTIONS: readonly InputAction[] = [
  InputAction.Interact,
  InputAction.Retry,
  InputAction.Phone,
  InputAction.Back,
];
