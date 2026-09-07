import {
  CircleGeometry,
  Mesh,
  MeshBasicMaterial,
} from 'three';

export class ContactShadow {
  public readonly mesh: Mesh<CircleGeometry, MeshBasicMaterial>;
  private baseOpacity: number;

  public constructor(radius: number, opacity = 0.2) {
    const material = new MeshBasicMaterial({
      color: 0x3a2822,
      transparent: true,
      opacity,
      depthWrite: false,
      toneMapped: false,
    });
    this.mesh = new Mesh(new CircleGeometry(radius, 24), material);
    this.mesh.name = 'CharacterContactShadow';
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.renderOrder = 1;
    this.baseOpacity = opacity;
  }

  public setStrength(scale: number, opacityScale: number): void {
    const safeScale = Number.isFinite(scale) ? Math.max(0.6, scale) : 1;
    const safeOpacityScale = Number.isFinite(opacityScale)
      ? Math.max(0, opacityScale)
      : 1;
    this.mesh.scale.setScalar(safeScale);
    this.mesh.material.opacity = this.baseOpacity * safeOpacityScale;
  }

  public setOpacity(opacity: number): void {
    this.baseOpacity = Math.max(0, opacity);
    this.mesh.material.opacity = this.baseOpacity;
  }
}
