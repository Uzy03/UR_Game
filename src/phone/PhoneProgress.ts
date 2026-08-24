import type { PhoneContentRegistry } from './PhoneContentRegistry';
import type { PhoneProgressStore } from './PhoneProgressStore';
import {
  createEmptyPhoneProgressSnapshot,
  isValidPhoneObjective,
  isValidStoryDate,
  parsePhoneProgressSnapshot,
  PHONE_PROGRESS_VERSION,
} from './PhoneProgressValidation';
import type {
  PhoneObjective,
  PhoneProgressActions,
  PhoneProgressSnapshot,
} from './PhoneTypes';

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
      version: PHONE_PROGRESS_VERSION,
      storyDate: this.storyDate,
      currentObjective: this.currentObjective === null
        ? null
        : { ...this.currentObjective },
      unlockedMessageIds: [...this.unlockedMessageIds],
      unlockedPhotoIds: [...this.unlockedPhotoIds],
    };
  }

  public setStoryDate(date: string): void {
    if (!isValidStoryDate(date)) {
      throw new Error(`Invalid story date "${String(date)}". Expected a real YYYY-MM-DD date.`);
    }
    if (this.storyDate === date) {
      return;
    }
    this.storyDate = date;
    this.save();
  }

  public setObjective(objective: PhoneObjective | null): void {
    if (!isValidPhoneObjective(objective)) {
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

  public replace(snapshot: PhoneProgressSnapshot): void {
    const parsed = parsePhoneProgressSnapshot(snapshot, this.registry, 'reject');
    if (parsed === null) {
      throw new Error('Cannot replace Phone progress with an invalid snapshot.');
    }

    this.storyDate = parsed.storyDate;
    this.currentObjective = parsed.currentObjective;
    this.unlockedMessageIds.clear();
    this.unlockedPhotoIds.clear();
    for (const messageId of parsed.unlockedMessageIds) {
      this.unlockedMessageIds.add(messageId);
    }
    for (const photoId of parsed.unlockedPhotoIds) {
      this.unlockedPhotoIds.add(photoId);
    }
    this.save();
  }

  public reset(): void {
    this.replace(createEmptyPhoneProgressSnapshot());
  }

  private save(): void {
    this.store.save(this.snapshot);
  }

}
