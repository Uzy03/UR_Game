import { Group, Vector3, type Vector3Like } from 'three';
import { disposeObject3D } from '../core/disposeObject3D';
import type { Interactable, InteractionContext } from '../interaction/Interactable';
import { InteractionHighlight } from '../visual/InteractionHighlight';
import type { CharacterAnimator } from '../visual/CharacterAnimator';
import { createNPCModel } from './createNPCModel';

interface NPCControllerOptions {
  readonly id: string;
  readonly displayName: string;
  readonly position: Readonly<Vector3Like>;
  readonly moveSpeed: number;
  readonly turnSharpness: number;
}

const ARRIVAL_DISTANCE = 0.03;
const MOVEMENT_EPSILON_SQUARED = 0.000001;

export class NPCController implements Interactable {
  public readonly id: string;
  public readonly displayName: string;
  public readonly object: Group;
  public readonly speechAnchor: Group;
  private readonly highlight: InteractionHighlight;
  private readonly animator: CharacterAnimator;
  private readonly destination = new Vector3();
  private readonly movement = new Vector3();
  private hasDestination = false;
  private interactionEnabled = true;
  private interactionHandler: (() => boolean) | null = null;
  private disposed = false;

  public constructor(private readonly options: NPCControllerOptions) {
    this.id = options.id;
    this.displayName = options.displayName;
    const model = createNPCModel();
    this.object = model.root;
    this.object.name = `NPC:${this.id}`;
    this.object.position.copy(options.position);
    this.highlight = new InteractionHighlight(model.highlight, 0.82);
    this.animator = model.animator;
    this.speechAnchor = model.speechAnchor;
  }

  public setInteractionHandler(handler: (() => boolean) | null): void {
    this.interactionHandler = handler;
  }

  public get isMoving(): boolean {
    return this.hasDestination;
  }

  public get isInteractionEnabled(): boolean {
    return this.interactionEnabled;
  }

  public setInteractionEnabled(enabled: boolean): void {
    this.interactionEnabled = enabled;
    if (!enabled) {
      this.setHighlighted(false);
    }
  }

  public canInteract(_context: InteractionContext): boolean {
    return !this.disposed && this.interactionEnabled && this.interactionHandler !== null;
  }

  public getInteractionLabel(_context: InteractionContext): string {
    return 'Talk';
  }

  public interact(_context: InteractionContext): boolean {
    const didInteract = (
      !this.disposed
      && this.interactionEnabled
      && (this.interactionHandler?.() ?? false)
    );
    if (didInteract) {
      this.animator.triggerInteraction();
    }
    return didInteract;
  }

  public getInteractionPosition(target: Vector3): Vector3 {
    this.object.getWorldPosition(target);
    target.y += 0.25;
    return target;
  }

  public setHighlighted(highlighted: boolean): void {
    this.highlight.setActive(highlighted);
  }

  public moveTo(position: Readonly<Vector3Like>): void {
    this.destination.copy(position);
    this.hasDestination = true;
  }

  public stop(): void {
    this.hasDestination = false;
  }

  public update(deltaSeconds: number): void {
    if (this.disposed) {
      return;
    }

    let actualSpeed = 0;
    if (this.hasDestination) {
      this.movement.subVectors(this.destination, this.object.position);
      this.movement.y = 0;
      const distance = this.movement.length();
      if (distance <= ARRIVAL_DISTANCE) {
        this.object.position.x = this.destination.x;
        this.object.position.z = this.destination.z;
        this.stop();
      } else {
        this.movement.normalize();
        const distanceThisFrame = Math.min(distance, this.options.moveSpeed * deltaSeconds);
        this.object.position.addScaledVector(this.movement, distanceThisFrame);
        actualSpeed = deltaSeconds > 0 ? distanceThisFrame / deltaSeconds : 0;

        if (this.movement.lengthSq() > MOVEMENT_EPSILON_SQUARED) {
          const targetFacing = Math.atan2(this.movement.x, this.movement.z);
          const currentFacing = this.object.rotation.y;
          const shortestAngle = Math.atan2(
            Math.sin(targetFacing - currentFacing),
            Math.cos(targetFacing - currentFacing),
          );
          const blend = 1 - Math.exp(-this.options.turnSharpness * deltaSeconds);
          this.object.rotation.y = currentFacing + shortestAngle * blend;
        }
      }
    }

    this.animator.update(deltaSeconds, {
      actualSpeed,
      maximumSpeed: this.options.moveSpeed,
      carrying: false,
    });
    this.highlight.update(deltaSeconds);
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.stop();
    this.interactionHandler = null;
    this.setHighlighted(false);
    this.object.removeFromParent();
    disposeObject3D(this.object);
    this.object.clear();
  }
}
