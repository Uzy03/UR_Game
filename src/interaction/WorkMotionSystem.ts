import { Vector3 } from 'three';
import type { PlayerController } from '../player/PlayerController';
import type { AssemblyStation } from './AssemblyStation';
import type { ProcessingStation } from './ProcessingStation';

export interface WorkMotionOptions {
  readonly playerInteractionRadius: number;
  readonly playerMaximumSpeed: number;
}

export class WorkMotionSystem {
  private readonly playerPosition = new Vector3();
  private readonly stationPosition = new Vector3();

  public constructor(
    private readonly player: PlayerController,
    private readonly processingStations: readonly ProcessingStation[],
    private readonly assemblyStations: readonly AssemblyStation[],
    private readonly options: WorkMotionOptions,
  ) {}

  public update(deltaSeconds: number): void {
    for (const station of this.processingStations) {
      station.updateVisual(deltaSeconds);
    }
    for (const station of this.assemblyStations) {
      station.updateVisual(deltaSeconds);
    }

    if (this.player.currentSpeed > this.options.playerMaximumSpeed || this.player.isCarrying) {
      this.player.setWorkMode('none');
      return;
    }
    this.player.object.getWorldPosition(this.playerPosition);
    const maximumDistanceSquared = this.options.playerInteractionRadius ** 2;
    let closestDistanceSquared = Number.POSITIVE_INFINITY;
    let workMode: 'none' | 'processing' | 'assembly' = 'none';
    for (const station of this.processingStations) {
      if (station.state !== 'processing') {
        continue;
      }
      station.object.getWorldPosition(this.stationPosition);
      const distanceSquared = planarDistanceSquared(this.playerPosition, this.stationPosition);
      if (distanceSquared <= maximumDistanceSquared && distanceSquared < closestDistanceSquared) {
        closestDistanceSquared = distanceSquared;
        workMode = 'processing';
      }
    }
    for (const station of this.assemblyStations) {
      if (station.state !== 'combining') {
        continue;
      }
      station.object.getWorldPosition(this.stationPosition);
      const distanceSquared = planarDistanceSquared(this.playerPosition, this.stationPosition);
      if (distanceSquared <= maximumDistanceSquared && distanceSquared < closestDistanceSquared) {
        closestDistanceSquared = distanceSquared;
        workMode = 'assembly';
      }
    }
    this.player.setWorkMode(workMode);
  }

  public reset(): void {
    this.player.setWorkMode('none');
    for (const station of this.processingStations) {
      station.resetVisual();
    }
    for (const station of this.assemblyStations) {
      station.resetVisual();
    }
  }
}

function planarDistanceSquared(left: Vector3, right: Vector3): number {
  return (left.x - right.x) ** 2 + (left.z - right.z) ** 2;
}
