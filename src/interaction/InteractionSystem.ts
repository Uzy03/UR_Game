import { Object3D, Vector3 } from 'three';
import type { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import type { InteractionPrompt } from '../ui/InteractionPrompt';
import type { CarrySystem } from './CarrySystem';
import type { Interactable, InteractionContext } from './Interactable';

interface InteractionSystemOptions {
  readonly maxDistance: number;
  readonly minForwardDot: number;
  readonly facingPenalty: number;
  readonly floorDropDistance: number;
}

const MIN_DIRECTION_LENGTH = 0.0001;

export class InteractionSystem {
  private readonly context: InteractionContext;
  private readonly playerPosition = new Vector3();
  private readonly playerForward = new Vector3();
  private readonly targetPosition = new Vector3();
  private readonly floorDropPosition = new Vector3();
  private readonly interactables = new Set<Interactable>();
  private currentTarget: Interactable | null = null;
  private enabled = true;

  public constructor(
    private readonly input: InputManager,
    private readonly player: Object3D,
    private readonly carry: CarrySystem,
    interactables: readonly Interactable[],
    private readonly prompt: InteractionPrompt,
    private readonly options: InteractionSystemOptions,
  ) {
    this.context = { carry };
    for (const interactable of interactables) {
      this.interactables.add(interactable);
    }
  }

  public update(): void {
    if (!this.enabled) {
      return;
    }

    this.refreshTargetAndPrompt();

    if (!this.input.consumeActionPress(InputAction.Interact)) {
      return;
    }

    if (this.currentTarget !== null) {
      this.currentTarget.interact(this.context);
    } else if (this.getValidFloorDropPosition() !== null) {
      this.carry.dropToFloor(this.floorDropPosition);
    }

    if (this.enabled) {
      this.refreshTargetAndPrompt();
    }
  }

  public register(interactable: Interactable): void {
    this.interactables.add(interactable);
  }

  public get isInteractionEnabled(): boolean {
    return this.enabled;
  }

  public unregister(interactable: Interactable): void {
    this.interactables.delete(interactable);
    if (this.currentTarget === interactable) {
      this.clearTargetAndPrompt();
    }
  }

  public setEnabled(enabled: boolean): void {
    if (enabled === this.enabled) {
      return;
    }

    this.enabled = enabled;
    if (!enabled) {
      this.clearTargetAndPrompt();
    }
  }

  public reset(): void {
    this.clearTargetAndPrompt();
  }

  public dispose(): void {
    this.clearTargetAndPrompt();
    this.interactables.clear();
  }

  private refreshTargetAndPrompt(): void {
    this.player.getWorldPosition(this.playerPosition);
    this.player.getWorldDirection(this.playerForward);
    this.playerForward.y = 0;

    if (this.playerForward.lengthSq() < MIN_DIRECTION_LENGTH) {
      this.playerForward.set(0, 0, 1);
    } else {
      this.playerForward.normalize();
    }

    let bestTarget: Interactable | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const interactable of this.interactables) {
      if (!interactable.canInteract(this.context)) {
        continue;
      }

      interactable.getInteractionPosition(this.targetPosition);
      const offsetX = this.targetPosition.x - this.playerPosition.x;
      const offsetZ = this.targetPosition.z - this.playerPosition.z;
      const distance = Math.hypot(offsetX, offsetZ);
      if (distance > this.options.maxDistance) {
        continue;
      }

      const forwardDot = distance < MIN_DIRECTION_LENGTH
        ? 1
        : (offsetX * this.playerForward.x + offsetZ * this.playerForward.z) / distance;
      if (forwardDot < this.options.minForwardDot) {
        continue;
      }

      const score = distance + (1 - forwardDot) * this.options.facingPenalty;
      if (score < bestScore) {
        bestScore = score;
        bestTarget = interactable;
      }
    }

    this.setCurrentTarget(bestTarget);

    if (this.currentTarget !== null) {
      this.prompt.setLabel(this.currentTarget.getInteractionLabel(this.context));
    } else {
      this.prompt.setLabel(this.getValidFloorDropPosition() === null ? null : 'Drop');
    }
  }

  private setCurrentTarget(target: Interactable | null): void {
    if (target === this.currentTarget) {
      return;
    }

    this.currentTarget?.setHighlighted(false);
    this.currentTarget = target;
    this.currentTarget?.setHighlighted(true);
  }

  private clearTargetAndPrompt(): void {
    this.currentTarget?.setHighlighted(false);
    this.currentTarget = null;
    this.prompt.setLabel(null);
  }

  private getValidFloorDropPosition(): Vector3 | null {
    if (!this.carry.hasItem) {
      return null;
    }

    this.floorDropPosition.copy(this.playerPosition).addScaledVector(
      this.playerForward,
      this.options.floorDropDistance,
    );
    this.floorDropPosition.y = 0;

    return this.carry.canDropToFloor(this.floorDropPosition) ? this.floorDropPosition : null;
  }
}
