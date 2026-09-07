import type {
  PhoneContentDefinition,
  PhoneMessageDefinition,
  PhonePhotoDefinition,
  PhoneThreadDefinition,
} from './PhoneTypes';

export class PhoneContentRegistry {
  private readonly threads = new Map<string, PhoneThreadDefinition>();
  private readonly messages = new Map<string, PhoneMessageDefinition>();
  private readonly photos = new Map<string, PhonePhotoDefinition>();

  public constructor(content: PhoneContentDefinition) {
    for (const thread of content.threads) {
      this.addUnique(this.threads, thread, 'thread');
    }
    for (const message of content.messages) {
      if (!this.threads.has(message.threadId)) {
        throw new Error(
          `Phone message "${message.id}" references unknown thread "${message.threadId}".`,
        );
      }
      this.addUnique(this.messages, message, 'message');
    }
    for (const photo of content.photos) {
      this.addUnique(this.photos, photo, 'photo');
    }
  }

  public getThread(id: string): PhoneThreadDefinition | undefined {
    return this.threads.get(id);
  }

  public getMessage(id: string): PhoneMessageDefinition | undefined {
    return this.messages.get(id);
  }

  public getPhoto(id: string): PhonePhotoDefinition | undefined {
    return this.photos.get(id);
  }

  private addUnique<T extends { readonly id: string }>(
    target: Map<string, T>,
    definition: T,
    kind: string,
  ): void {
    if (definition.id.length === 0) {
      throw new Error(`Phone ${kind} ID must not be empty.`);
    }
    if (target.has(definition.id)) {
      throw new Error(`Duplicate phone ${kind} ID "${definition.id}".`);
    }
    target.set(definition.id, definition);
  }
}
