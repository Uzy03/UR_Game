import type { WorldProgress } from '../world/WorldProgress';
import type { WorldRoute } from '../world/WorldRoute';
import type { PhoneProgressSnapshot } from './PhoneTypes';

export interface MemoryEntry {
  readonly id: string;
  readonly routeLabel: string;
  readonly stageLabel: string;
  readonly state: 'Cleared';
}

export interface ProfileView {
  readonly name: 'You';
  readonly storyDate: string;
  readonly objective: string;
  readonly completedRouteCount: number;
  readonly unlockedMessageCount: number;
  readonly unlockedPhotoCount: number;
}

export function clearedMemories(route: WorldRoute, progress: WorldProgress): readonly MemoryEntry[] {
  const completed = new Set(progress.completedNodeIds);
  return route.nodes.filter((node) => completed.has(node.id)).map((node) => ({
    id: node.id,
    routeLabel: node.label,
    stageLabel: node.stageLabel,
    state: 'Cleared' as const,
  }));
}

export function profileView(
  phone: PhoneProgressSnapshot,
  completedRouteCount: number,
): ProfileView {
  return {
    name: 'You',
    storyDate: phone.storyDate ?? 'Not set',
    objective: phone.currentObjective?.text ?? 'No current objective',
    completedRouteCount,
    unlockedMessageCount: phone.unlockedMessageIds.length,
    unlockedPhotoCount: phone.unlockedPhotoIds.length,
  };
}
