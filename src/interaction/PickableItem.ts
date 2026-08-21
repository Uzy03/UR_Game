import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  RingGeometry,
  SphereGeometry,
  type Vector3Like,
  Vector3,
} from 'three';
import type { Interactable, InteractionContext } from './Interactable';

export type PickableItemKind = 'tomato' | 'box' | 'plate';
type PickableItemState = 'world' | 'carried' | 'placed';

interface PickableItemOptions {
  readonly id: string;
  readonly kind: PickableItemKind;
  readonly position: Readonly<Vector3Like>;
  readonly parent: Object3D;
}

const ITEM_FOOTPRINT_RADIUS: Record<PickableItemKind, number> = {
  tomato: 0.23,
  box: 0.3,
  plate: 0.32,
};

export class PickableItem implements Interactable {
  public readonly id: string;
  public readonly object = new Group();
  public readonly footprintRadius: number;
  private readonly highlight: Mesh;
  private state: PickableItemState = 'world';

  public constructor(options: PickableItemOptions) {
    this.id = options.id;
    this.object.name = `PickableItem:${options.id}`;
    this.footprintRadius = ITEM_FOOTPRINT_RADIUS[options.kind];
    this.object.add(this.createVisual(options.kind));

    this.highlight = new Mesh(
      new RingGeometry(this.footprintRadius + 0.04, this.footprintRadius + 0.12, 32),
      new MeshBasicMaterial({ color: 0xffef8a, transparent: true, opacity: 0.9, depthWrite: false }),
    );
    this.highlight.name = 'InteractionHighlight';
    this.highlight.rotation.x = -Math.PI / 2;
    this.highlight.position.y = 0.012;
    this.highlight.visible = false;
    this.object.add(this.highlight);

    options.parent.add(this.object);
    this.object.position.copy(options.position);
  }

  public canInteract(context: InteractionContext): boolean {
    return this.state === 'world' && !context.carry.hasItem;
  }

  public getInteractionLabel(_context: InteractionContext): string {
    return 'Pick up';
  }

  public interact(context: InteractionContext): boolean {
    return context.carry.pickUp(this);
  }

  public getInteractionPosition(target: Vector3): Vector3 {
    this.object.getWorldPosition(target);
    target.y += 0.2;
    return target;
  }

  public setHighlighted(highlighted: boolean): void {
    this.highlight.visible = highlighted;
  }

  public isOnFloor(): boolean {
    return this.state === 'world';
  }

  public carryBy(anchor: Object3D): void {
    this.state = 'carried';
    this.setHighlighted(false);
    anchor.add(this.object);
    this.object.position.set(0, 0, 0);
    this.object.rotation.set(0, 0, 0);
  }

  public placeAt(anchor: Object3D): void {
    this.state = 'placed';
    this.setHighlighted(false);
    anchor.add(this.object);
    this.object.position.set(0, 0, 0);
    this.object.rotation.set(0, 0, 0);
  }

  public placeOnFloor(parent: Object3D, position: Readonly<Vector3Like>): void {
    this.state = 'world';
    this.setHighlighted(false);
    parent.add(this.object);
    this.object.position.copy(position);
    this.object.rotation.set(0, 0, 0);
  }

  private createVisual(kind: PickableItemKind): Group {
    const visual = new Group();

    if (kind === 'tomato') {
      const body = new Mesh(
        new SphereGeometry(0.23, 18, 14),
        new MeshStandardMaterial({ color: 0xe9514f, roughness: 0.72 }),
      );
      body.position.y = 0.23;
      visual.add(body);

      const leaves = new Mesh(
        new CylinderGeometry(0.04, 0.12, 0.045, 6),
        new MeshStandardMaterial({ color: 0x4f9b62, roughness: 0.8 }),
      );
      leaves.position.y = 0.45;
      visual.add(leaves);
    } else if (kind === 'box') {
      const box = new Mesh(
        new BoxGeometry(0.46, 0.38, 0.46),
        new MeshStandardMaterial({ color: 0xe4aa52, roughness: 0.82 }),
      );
      box.position.y = 0.19;
      visual.add(box);
    } else {
      const plate = new Mesh(
        new CylinderGeometry(0.3, 0.25, 0.075, 24),
        new MeshStandardMaterial({ color: 0xf5f1df, roughness: 0.55 }),
      );
      plate.position.y = 0.04;
      visual.add(plate);
    }

    visual.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    return visual;
  }
}
