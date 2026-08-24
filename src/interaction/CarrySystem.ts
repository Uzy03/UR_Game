import type { Object3D, Vector3Like } from 'three';
import type { PickableItem } from './PickableItem';

export type FloorDropValidator = (
  position: Readonly<Vector3Like>,
  item: PickableItem,
  allItems: readonly PickableItem[],
) => boolean;

export class CarrySystem {
  private carriedItem: PickableItem | null = null;
  private sceneBinding: {
    readonly worldRoot: Object3D;
    readonly allItems: readonly PickableItem[];
    readonly floorDropValidator: FloorDropValidator;
  } | null = null;

  public constructor(
    private readonly carryAnchor: Object3D,
  ) {}

  public bindScene(
    worldRoot: Object3D,
    allItems: readonly PickableItem[],
    floorDropValidator: FloorDropValidator,
  ): void {
    this.reset();
    this.sceneBinding = { worldRoot, allItems, floorDropValidator };
  }

  public unbindScene(): void {
    this.reset();
    this.sceneBinding = null;
  }

  public get hasItem(): boolean {
    return this.carriedItem !== null;
  }

  public get item(): PickableItem | null {
    return this.carriedItem;
  }

  public pickUp(item: PickableItem): boolean {
    if (
      this.carriedItem !== null
      || this.sceneBinding === null
      || !this.sceneBinding.allItems.includes(item)
    ) {
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
      && this.sceneBinding !== null
      && this.sceneBinding.floorDropValidator(
        position,
        this.carriedItem,
        this.sceneBinding.allItems,
      );
  }

  public dropToFloor(position: Readonly<Vector3Like>): boolean {
    if (!this.canDropToFloor(position) || this.carriedItem === null) {
      return false;
    }

    const item = this.carriedItem;
    this.carriedItem = null;
    const binding = this.sceneBinding;
    if (binding === null) {
      item.reset();
      return false;
    }
    item.placeOnFloor(binding.worldRoot, position);
    return true;
  }

  public reset(): void {
    this.carriedItem?.reset();
    this.carriedItem = null;
  }
}
