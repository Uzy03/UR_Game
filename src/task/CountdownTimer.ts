export class CountdownTimer {
  private remaining = 0;
  private running = false;
  private started = false;

  public get remainingSeconds(): number {
    return this.remaining;
  }

  public get isExpired(): boolean {
    return this.started && this.remaining <= 0;
  }

  public get isRunning(): boolean {
    return this.running;
  }

  public start(durationSeconds: number): void {
    this.remaining = Math.max(0, durationSeconds);
    this.running = this.remaining > 0;
    this.started = true;
  }

  public update(deltaSeconds: number): void {
    if (!this.running) {
      return;
    }

    this.remaining = Math.max(0, this.remaining - Math.max(0, deltaSeconds));
    if (this.remaining === 0) {
      this.running = false;
    }
  }

  public stop(): void {
    this.running = false;
  }

  public reset(): void {
    this.remaining = 0;
    this.running = false;
    this.started = false;
  }
}
