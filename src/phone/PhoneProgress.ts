import type { PhoneContentRegistry } from './PhoneContentRegistry';
import type { PhoneProgressStore } from './PhoneProgressStore';
import type {
  PhoneObjective,
  PhoneProgressActions,
  PhoneProgressSnapshot,
} from './PhoneTypes';

const SNAPSHOT_VERSION = 1;

export class PhoneProgress implements PhoneProgressActions {
  private storyDate: string | null;
  private currentObjective: PhoneObjective | null;
  private readonly unlockedMessageIds: Set<string>;
  private readonly unlockedPhotoIds: Set<string>;

  public constructor(
    private readonly registry: PhoneContentRegistry,
    private readonly store: PhoneProgressStore,
  ) {
    const snapshot = store.load(registry);
    this.storyDate = snapshot.storyDate;
    this.currentObjective = snapshot.currentObjective;
    this.unlockedMessageIds = new Set(snapshot.unlockedMessageIds);
    this.unlockedPhotoIds = new Set(snapshot.unlockedPhotoIds);
  }

  public get snapshot(): PhoneProgressSnapshot {
    return {
      version: SNAPSHOT_VERSION,
      storyDate: this.storyDate,
      currentObjective: this.currentObjective === null
        ? null
        : { ...this.currentObjective },
      unlockedMessageIds: [...this.unlockedMessageIds],
      unlockedPhotoIds: [...this.unlockedPhotoIds],
    };
  }

  public setStoryDate(date: string): void {
    if (!this.isValidStoryDate(date)) {
      throw new Error(`Invalid story date "${String(date)}". Expected a real YYYY-MM-DD date.`);
    }
    if (this.storyDate === date) {
      return;
    }
    this.storyDate = date;
    this.save();
  }

  public setObjective(objective: PhoneObjective | null): void {
    if (!this.isValidObjective(objective)) {
      throw new Error('Phone objective must contain non-empty id and text values.');
    }

    const nextObjective = objective === null ? null : { ...objective };
    if (
      this.currentObjective?.id === nextObjective?.id
      && this.currentObjective?.text === nextObjective?.text
    ) {
      return;
    }
    this.currentObjective = nextObjective;
    this.save();
  }

  public unlockMessage(messageId: string): void {
    if (this.registry.getMessage(messageId) === undefined) {
      throw new Error(`Phone message "${messageId}" is not registered.`);
    }
    if (this.unlockedMessageIds.has(messageId)) {
      return;
    }
    this.unlockedMessageIds.add(messageId);
    this.save();
  }

  public unlockPhoto(photoId: string): void {
    if (this.registry.getPhoto(photoId) === undefined) {
      throw new Error(`Phone photo "${photoId}" is not registered.`);
    }
    if (this.unlockedPhotoIds.has(photoId)) {
      return;
    }
    this.unlockedPhotoIds.add(photoId);
    this.save();
  }

  private save(): void {
    this.store.save(this.snapshot);
  }

  private isValidObjective(value: PhoneObjective | null): boolean {
    return value === null
      || (
        typeof value.id === 'string'
        && value.id.trim().length > 0
        && typeof value.text === 'string'
        && value.text.trim().length > 0
      );
  }

  private isValidStoryDate(value: string): boolean {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (match === null) {
      return false;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
      && date.getUTCMonth() === month - 1
      && date.getUTCDate() === day;
  }
}
