import { Object3D, PerspectiveCamera, Vector3 } from 'three';

export class SpeechBubble {
  private readonly worldPosition = new Vector3();
  private target: Object3D | null = null;
  private remainingSeconds = 0;

  public constructor(
    private readonly element: HTMLElement,
    private readonly viewport: HTMLElement,
  ) {}

  public show(target: Object3D, message: string, durationSeconds: number): void {
    this.target = target;
    this.remainingSeconds = Math.max(0, durationSeconds);
    this.element.textContent = message;
    this.element.hidden = false;
  }

  public update(camera: PerspectiveCamera, deltaSeconds: number): void {
    if (this.target === null) {
      return;
    }

    this.remainingSeconds = Math.max(0, this.remainingSeconds - Math.max(0, deltaSeconds));
    if (this.remainingSeconds === 0) {
      this.hide();
      return;
    }

    this.target.getWorldPosition(this.worldPosition);
    this.worldPosition.project(camera);
    const visible = this.worldPosition.z >= -1 && this.worldPosition.z <= 1;
    this.element.hidden = !visible;
    if (!visible) {
      return;
    }

    const bounds = this.viewport.getBoundingClientRect();
    const x = bounds.left + (this.worldPosition.x * 0.5 + 0.5) * bounds.width;
    const y = bounds.top + (-this.worldPosition.y * 0.5 + 0.5) * bounds.height;
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
  }

  public hide(): void {
    this.target = null;
    this.remainingSeconds = 0;
    this.element.hidden = true;
    this.element.textContent = '';
  }
}
