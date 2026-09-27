import { INPUT_ACTIONS, InputAction } from './InputAction';
import type { InputSource, MovementInput } from './InputSource';

export type GamepadProvider = () => readonly (Gamepad | null)[];

export const DEFAULT_GAMEPAD_DEADZONE = 0.18;

const BUTTON_ACTIONS: ReadonlyMap<InputAction, number> = new Map([
  [InputAction.Dash, 0],
  [InputAction.Back, 0],
  [InputAction.Interact, 1],
  [InputAction.Retry, 1],
  [InputAction.Throw, 3],
  [InputAction.Work, 3],
  [InputAction.Phone, 9],
]);

function browserGamepads(): readonly (Gamepad | null)[] {
  return typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function'
    ? navigator.getGamepads()
    : [];
}

function safeAxis(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(-1, Math.min(1, value ?? 0)) : 0;
}

export function radialDeadzone(x: number, y: number, deadzone = DEFAULT_GAMEPAD_DEADZONE): MovementInput {
  if (!Number.isFinite(deadzone) || deadzone < 0 || deadzone >= 1) {
    throw new RangeError('Gamepad deadzone must be finite and between 0 and 1.');
  }
  const safeX = safeAxis(x);
  const safeY = safeAxis(y);
  const length = Math.hypot(safeX, safeY);
  if (length <= deadzone) return { x: 0, y: 0 };
  const magnitude = (Math.min(1, length) - deadzone) / (1 - deadzone);
  return { x: safeX / length * magnitude, y: safeY / length * magnitude };
}

export class GamepadInput implements InputSource {
  private selectedIndex: number | null = null;
  private hasSelectedPad = false;
  private movement: MovementInput = { x: 0, y: 0 };
  private readonly held = new Set<InputAction>();
  private readonly edges = new Set<InputAction>();

  public constructor(
    private readonly provider: GamepadProvider = browserGamepads,
    private readonly deadzone = DEFAULT_GAMEPAD_DEADZONE,
  ) {
    if (!Number.isFinite(deadzone) || deadzone < 0 || deadzone >= 1) {
      throw new RangeError('Gamepad deadzone must be finite and between 0 and 1.');
    }
  }

  public update(): void {
    let pads: readonly (Gamepad | null)[];
    try {
      pads = this.provider();
    } catch {
      this.clear();
      this.selectedIndex = null;
      return;
    }
    let pad = this.selectedIndex === null ? null : pads[this.selectedIndex] ?? null;
    if (pad?.connected !== true) {
      this.clear();
      pad = pads.find((candidate) => candidate?.connected && candidate.mapping === 'standard')
        ?? pads.find((candidate) => candidate?.connected) ?? null;
      this.selectedIndex = pad?.index ?? null;
      if (pad === null) return;
      // The first observed press can wake the Gamepad API. Later pad changes
      // adopt held state without manufacturing a new press.
      this.readPad(pad, !this.hasSelectedPad);
      this.hasSelectedPad = true;
      return;
    }
    this.readPad(pad, true);
  }

  public getMovement(): MovementInput { return this.movement; }
  public isActionPressed(action: InputAction): boolean { return this.held.has(action); }
  public wasActionPressed(action: InputAction): boolean { return this.edges.has(action); }

  public dispose(): void {
    this.clear();
    this.selectedIndex = null;
  }

  private readPad(pad: Gamepad, detectEdges: boolean): void {
    this.movement = radialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0, this.deadzone);
    this.edges.clear();
    for (const action of INPUT_ACTIONS) {
      const button = BUTTON_ACTIONS.get(action);
      const pressed = button !== undefined && pad.buttons[button]?.pressed === true;
      if (pressed) {
        if (detectEdges && !this.held.has(action)) this.edges.add(action);
        this.held.add(action);
      } else {
        this.held.delete(action);
      }
    }
  }

  private clear(): void {
    this.movement = { x: 0, y: 0 };
    this.held.clear();
    this.edges.clear();
  }
}
