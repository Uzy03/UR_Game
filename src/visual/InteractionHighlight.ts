import type { Mesh, MeshBasicMaterial } from 'three';

export class InteractionHighlight {
  private elapsedSeconds = 0;
  private active = false;

  public constructor(
    public readonly mesh: Mesh,
    private readonly baseOpacity: number,
  ) {
    this.mesh.visible = false;
  }

  public setActive(active: boolean): void {
    this.active = active;
    this.mesh.visible = active;
    if (!active) {
      this.elapsedSeconds = 0;
      this.mesh.scale.setScalar(1);
      this.setOpacity(this.baseOpacity);
    }
  }

  public update(deltaSeconds: number): void {
    if (!this.active) {
      return;
    }
    const delta = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0;
    this.elapsedSeconds += delta;
    const pulse = 0.5 + 0.5 * Math.sin(this.elapsedSeconds * 5.5);
    this.mesh.scale.setScalar(1 + pulse * 0.07);
    this.setOpacity(this.baseOpacity * (0.78 + pulse * 0.22));
  }

  private setOpacity(opacity: number): void {
    const materials = Array.isArray(this.mesh.material)
      ? this.mesh.material
      : [this.mesh.material];
    for (const material of materials) {
      if (material.type === 'MeshBasicMaterial') {
        (material as MeshBasicMaterial).opacity = opacity;
      }
    }
  }
}
