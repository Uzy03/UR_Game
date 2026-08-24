export interface PhoneObjective {
  readonly id: string;
  readonly text: string;
}

export interface PhoneMessageDefinition {
  readonly id: string;
  readonly threadId: string;
  readonly sender: string;
  readonly text: string;
  readonly timeLabel: string;
}

export interface PhoneThreadDefinition {
  readonly id: string;
  readonly title: string;
}

export interface PhonePhotoDefinition {
  readonly id: string;
  readonly src: string;
  readonly alt: string;
  readonly caption: string;
  readonly date: string;
}

export interface PhoneContentDefinition {
  readonly threads: readonly PhoneThreadDefinition[];
  readonly messages: readonly PhoneMessageDefinition[];
  readonly photos: readonly PhonePhotoDefinition[];
}

export interface PhoneProgressSnapshot {
  readonly version: 1;
  readonly storyDate: string | null;
  readonly currentObjective: PhoneObjective | null;
  readonly unlockedMessageIds: readonly string[];
  readonly unlockedPhotoIds: readonly string[];
}

export interface PhoneProgressActions {
  setStoryDate(date: string): void;
  setObjective(objective: PhoneObjective | null): void;
  unlockMessage(messageId: string): void;
  unlockPhoto(photoId: string): void;
}

export type PhoneScreen = 'home' | 'messages' | 'album';
