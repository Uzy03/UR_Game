import {
  Group,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  type Vector3Like,
  Vector3,
} from 'three';
import type { Interactable, InteractionContext } from './Interactable';
import type { PickableItem } from './PickableItem';
import { InteractionHighlight } from '../visual/InteractionHighlight';

interface PlacePointOptions {
  readonly id: string;
  readonly position: Readonly<Vector3Like>;
  readonly parent: Group;
}

export class PlacePoint implements Interactable {
  public readonly id: string;
  public readonly object = new Group();
  private readonly highlight: InteractionHighlight;
  private placedItem: PickableItem | null = null;

  public constructor(options: PlacePointOptions) {
    this.id = options.id;
    this.object.name = `PlacePoint:${options.id}`;
    this.object.position.copy(options.position);

    const highlightMesh = new Mesh(
      new RingGeometry(0.26, 0.38, 32),
      new MeshBasicMaterial({
        color: 0xf3d58a,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    highlightMesh.rotation.x = -Math.PI / 2;
    highlightMesh.position.y = 0.018;
    this.object.add(highlightMesh);
    this.highlight = new InteractionHighlight(highlightMesh, 0.82);
    options.parent.add(this.object);
  }

  public get isOccupied(): boolean {
    return this.placedItem !== null;
  }

  public get currentItem(): PickableItem | null {
    return this.placedItem;
  }

  public canInteract(context: InteractionContext): boolean {
    return context.carry.hasItem ? !this.isOccupied : this.isOccupied;
  }

  public getInteractionLabel(context: InteractionContext): string {
    return context.carry.hasItem ? 'Place' : 'Pick up';
  }

  public interact(context: InteractionContext): boolean {
    if (context.carry.hasItem && this.placedItem === null) {
      const item = context.carry.releaseForPlacement();
      if (item === null) {
        return false;
      }

      this.placedItem = item;
      item.placeAt(this.object);
      return true;
    }

    if (!context.carry.hasItem && this.placedItem !== null) {
      const item = this.placedItem;
      if (context.carry.pickUp(item)) {
        this.placedItem = null;
        return true;
      }
    }

    return false;
  }

  public getInteractionPosition(target: Vector3): Vector3 {
    return this.object.getWorldPosition(target);
  }

  public setHighlighted(highlighted: boolean): void {
    this.highlight.setActive(highlighted);
  }

  public updateVisual(deltaSeconds: number): void {
    this.highlight.update(deltaSeconds);
  }

  public reset(): void {
    this.placedItem = null;
    this.setHighlighted(false);
  }
}
