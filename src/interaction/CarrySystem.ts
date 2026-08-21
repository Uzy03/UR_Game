import type { Object3D, Vector3Like } from 'three';
import type { PickableItem } from './PickableItem';

export type FloorDropValidator = (
  position: Readonly<Vector3Like>,
  item: PickableItem,
  allItems: readonly PickableItem[],
) => boolean;

export class CarrySystem {
  private carriedItem: PickableItem | null = null;

  public constructor(
    private readonly carryAnchor: Object3D,
    private readonly worldRoot: Object3D,
    private readonly allItems: readonly PickableItem[],
    private readonly floorDropValidator: FloorDropValidator,
  ) {}

  public get hasItem(): boolean {
    return this.carriedItem !== null;
  }

  public get item(): PickableItem | null {
    return this.carriedItem;
  }

  public pickUp(item: PickableItem): boolean {
    if (this.carriedItem !== null) {
      return false;
    }

    this.carriedItem = item;
    item.carryBy(this.carryAnchor);
    return true;
  }

  public releaseForPlacement(): PickableItem | null {
    const item = this.carriedItem;
    this.carriedItem = null;
    return item;
  }

  public canDropToFloor(position: Readonly<Vector3Like>): boolean {
    return this.carriedItem !== null
      && this.floorDropValidator(position, this.carriedItem, this.allItems);
  }

  public dropToFloor(position: Readonly<Vector3Like>): boolean {
    if (!this.canDropToFloor(position) || this.carriedItem === null) {
      return false;
    }

    const item = this.carriedItem;
    this.carriedItem = null;
    item.placeOnFloor(this.worldRoot, position);
    return true;
  }
}
