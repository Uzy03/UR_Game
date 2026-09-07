import type { TransitionCardDefinition } from './EventTypes';

// EventRunner depends on this boundary instead of DOM elements or CSS state.
export interface TransitionActions {
  show(card: TransitionCardDefinition): void;
  hide(): void;
}
