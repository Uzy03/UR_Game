import { isValidStoryDate } from '../../phone/PhoneProgressValidation';
import type {
  CampaignStoryDefinition,
  StoryDialogueLines,
  StoryMessageContent,
  StoryPhoneCardText,
  StoryPhotoContent,
  StoryTransitionContent,
} from './CampaignStoryTypes';

type UnknownRecord = Record<string, unknown>;

export function parseCampaignStoryDefinition(value: unknown): CampaignStoryDefinition {
  const root = requireRecord(value, 'story');
  const prologue = requireRecord(root.prologue, 'story.prologue');
  const meeting = requireRecord(root.meeting, 'story.meeting');
  const outing = requireRecord(root.outing, 'story.outing');
  const preparation = requireRecord(root.preparation, 'story.preparation');
  const journey = requireRecord(root.journey, 'story.journey');
  const ending = requireRecord(root.ending, 'story.ending');

  return {
    phoneThreadTitle: requireText(root.phoneThreadTitle, 'story.phoneThreadTitle'),
    prologue: {
      date: requireDate(prologue.date, 'story.prologue.date'),
      connectionCard: parsePhoneCard(prologue.connectionCard, 'story.prologue.connectionCard'),
      invitationCard: parsePhoneCard(prologue.invitationCard, 'story.prologue.invitationCard'),
      invitationMessage: parseMessage(
        prologue.invitationMessage,
        'story.prologue.invitationMessage',
      ),
    },
    meeting: {
      date: requireDate(meeting.date, 'story.meeting.date'),
      transition: parseTransition(meeting.transition, 'story.meeting.transition'),
      dialogueIntro: parseDialogue(meeting.dialogueIntro, 'story.meeting.dialogueIntro'),
      dialogueOutro: parseDialogue(meeting.dialogueOutro, 'story.meeting.dialogueOutro'),
      photo: parsePhoto(meeting.photo, 'story.meeting.photo'),
    },
    outing: {
      date: requireDate(outing.date, 'story.outing.date'),
      transition: parseTransition(outing.transition, 'story.outing.transition'),
      dialogueIntro: parseDialogue(outing.dialogueIntro, 'story.outing.dialogueIntro'),
      dialogueMiddle: parseDialogue(outing.dialogueMiddle, 'story.outing.dialogueMiddle'),
      dialogueOutro: parseDialogue(outing.dialogueOutro, 'story.outing.dialogueOutro'),
      message: parseMessage(outing.message, 'story.outing.message'),
      photo: parsePhoto(outing.photo, 'story.outing.photo'),
    },
    preparation: {
      date: requireDate(preparation.date, 'story.preparation.date'),
      transition: parseTransition(preparation.transition, 'story.preparation.transition'),
      dialogueIntro: parseDialogue(
        preparation.dialogueIntro,
        'story.preparation.dialogueIntro',
      ),
      dialogueReady: parseDialogue(
        preparation.dialogueReady,
        'story.preparation.dialogueReady',
      ),
      dialogueOutro: parseDialogue(
        preparation.dialogueOutro,
        'story.preparation.dialogueOutro',
      ),
      message: parseMessage(preparation.message, 'story.preparation.message'),
      photo: parsePhoto(preparation.photo, 'story.preparation.photo'),
    },
    journey: {
      date: requireDate(journey.date, 'story.journey.date'),
      transition: parseTransition(journey.transition, 'story.journey.transition'),
      dialogueIntro: parseDialogue(journey.dialogueIntro, 'story.journey.dialogueIntro'),
      dialogueReady: parseDialogue(journey.dialogueReady, 'story.journey.dialogueReady'),
      dialogueOutro: parseDialogue(journey.dialogueOutro, 'story.journey.dialogueOutro'),
      photo: parsePhoto(journey.photo, 'story.journey.photo'),
    },
    ending: {
      date: requireDate(ending.date, 'story.ending.date'),
      transition: parseTransition(ending.transition, 'story.ending.transition'),
      card: parsePhoneCard(ending.card, 'story.ending.card'),
      dialogueIntro: parseDialogue(ending.dialogueIntro, 'story.ending.dialogueIntro'),
      dialogueFinal: parseDialogue(ending.dialogueFinal, 'story.ending.dialogueFinal'),
      message: parseMessage(ending.message, 'story.ending.message'),
      photo: parsePhoto(ending.photo, 'story.ending.photo'),
      completionSpeech: requireText(
        ending.completionSpeech,
        'story.ending.completionSpeech',
      ),
      resumeSpeech: requireText(ending.resumeSpeech, 'story.ending.resumeSpeech'),
    },
  };
}

function parsePhoneCard(value: unknown, path: string): StoryPhoneCardText {
  const card = requireRecord(value, path);
  const subtitle = optionalText(card.subtitle, `${path}.subtitle`);
  return {
    appLabel: requireText(card.appLabel, `${path}.appLabel`),
    title: requireText(card.title, `${path}.title`),
    ...(subtitle === undefined ? {} : { subtitle }),
    body: requireText(card.body, `${path}.body`),
    actionLabel: requireText(card.actionLabel, `${path}.actionLabel`),
  };
}

function parseMessage(value: unknown, path: string): StoryMessageContent {
  const message = requireRecord(value, path);
  return {
    sender: requireText(message.sender, `${path}.sender`),
    text: requireText(message.text, `${path}.text`),
    timeLabel: requireText(message.timeLabel, `${path}.timeLabel`),
  };
}

function parsePhoto(value: unknown, path: string): StoryPhotoContent {
  const photo = requireRecord(value, path);
  const src = requireText(photo.src, `${path}.src`);
  if (!isRepositoryLocalPath(src)) {
    throw new Error(`${path}.src must be a repository-local absolute path.`);
  }
  return {
    src,
    alt: requireText(photo.alt, `${path}.alt`),
    caption: requireText(photo.caption, `${path}.caption`),
    date: requireDate(photo.date, `${path}.date`),
  };
}

function parseTransition(value: unknown, path: string): StoryTransitionContent {
  const transition = requireRecord(value, path);
  const subtitle = optionalText(transition.subtitle, `${path}.subtitle`);
  return {
    eyebrow: requireText(transition.eyebrow, `${path}.eyebrow`),
    title: requireText(transition.title, `${path}.title`),
    ...(subtitle === undefined ? {} : { subtitle }),
  };
}

function parseDialogue(value: unknown, path: string): StoryDialogueLines {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${path} must be a non-empty array.`);
  }
  return value.map((entry, index) => {
    const linePath = `${path}[${index}]`;
    const line = requireRecord(entry, linePath);
    return {
      speaker: requireText(line.speaker, `${linePath}.speaker`),
      text: requireText(line.text, `${linePath}.text`),
    };
  });
}

function requireDate(value: unknown, path: string): string {
  if (!isValidStoryDate(value)) {
    throw new Error(`${path} must be a real YYYY-MM-DD date.`);
  }
  return value;
}

function requireText(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${path} must be a non-empty string.`);
  }
  return value;
}

function optionalText(value: unknown, path: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return requireText(value, path);
}

function requireRecord(value: unknown, path: string): UnknownRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${path} must be an object.`);
  }
  return value as UnknownRecord;
}

function isRepositoryLocalPath(value: string): boolean {
  if (!value.startsWith('/') || value.startsWith('//')) {
    return false;
  }
  const segments = value.split('/');
  return !segments.includes('.') && !segments.includes('..');
}
