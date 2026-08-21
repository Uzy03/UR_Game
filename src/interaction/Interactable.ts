import type { Vector3 } from 'three';
import type { CarrySystem } from './CarrySystem';

export interface InteractionContext {
  readonly carry: CarrySystem;
}

export interface Interactable {
  readonly id: string;
  canInteract(context: InteractionContext): boolean;
  getInteractionLabel(context: InteractionContext): string;
  interact(context: InteractionContext): boolean;
  getInteractionPosition(target: Vector3): Vector3;
  setHighlighted(highlighted: boolean): void;
}
