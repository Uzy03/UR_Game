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

export type CampaignPhotoPathPolicy = 'repository-local' | 'private-photos-only';

export interface CampaignStoryValidationOptions {
  readonly photoPathPolicy?: CampaignPhotoPathPolicy;
}

export function parseCampaignStoryDefinition(
  value: unknown,
  options: CampaignStoryValidationOptions = {},
): CampaignStoryDefinition {
  const photoPathPolicy = options.photoPathPolicy ?? 'repository-local';
  const root = requireRecord(value, 'story');
  const prologue = requireRecord(root.prologue, 'story.prologue');
  const meeting = requireRecord(root.meeting, 'story.meeting');
  const outing = requireRecord(root.outing, 'story.outing');
  const preparation = requireRecord(root.preparation, 'story.preparation');
  const journey = requireRecord(root.journey, 'story.journey');
  const ending = requireRecord(root.ending, 'story.ending');

  return {
    companionDisplayName: requireText(
      root.companionDisplayName,
      'story.companionDisplayName',
    ),
    phoneThreadTitle: requireText(root.phoneThreadTitle, 'story.phoneThreadTitle'),
    prologue: {
      date: requireDate(prologue.date, 'story.prologue.date'),
      checkPhoneObjectiveText: requireText(
        prologue.checkPhoneObjectiveText,
        'story.prologue.checkPhoneObjectiveText',
      ),
      meetObjectiveText: requireText(
        prologue.meetObjectiveText,
        'story.prologue.meetObjectiveText',
      ),
      connectionCard: parsePhoneCard(prologue.connectionCard, 'story.prologue.connectionCard'),
      invitationCard: parsePhoneCard(prologue.invitationCard, 'story.prologue.invitationCard'),
      invitationMessage: parseMessage(
        prologue.invitationMessage,
        'story.prologue.invitationMessage',
      ),
    },
    meeting: {
      date: requireDate(meeting.date, 'story.meeting.date'),
      placementObjectiveText: requireText(
        meeting.placementObjectiveText,
        'story.meeting.placementObjectiveText',
      ),
      placementTaskLabel: requireText(
        meeting.placementTaskLabel,
        'story.meeting.placementTaskLabel',
      ),
      transition: parseTransition(meeting.transition, 'story.meeting.transition'),
      dialogueIntro: parseDialogue(meeting.dialogueIntro, 'story.meeting.dialogueIntro'),
      dialogueOutro: parseDialogue(meeting.dialogueOutro, 'story.meeting.dialogueOutro'),
      photo: parsePhoto(meeting.photo, 'story.meeting.photo', photoPathPolicy),
    },
    outing: {
      date: requireDate(outing.date, 'story.outing.date'),
      firstReachObjectiveText: requireText(
        outing.firstReachObjectiveText,
        'story.outing.firstReachObjectiveText',
      ),
      firstReachTaskLabel: requireText(
        outing.firstReachTaskLabel,
        'story.outing.firstReachTaskLabel',
      ),
      secondReachObjectiveText: requireText(
        outing.secondReachObjectiveText,
        'story.outing.secondReachObjectiveText',
      ),
      secondReachTaskLabel: requireText(
        outing.secondReachTaskLabel,
        'story.outing.secondReachTaskLabel',
      ),
      transition: parseTransition(outing.transition, 'story.outing.transition'),
      dialogueIntro: parseDialogue(outing.dialogueIntro, 'story.outing.dialogueIntro'),
      dialogueMiddle: parseDialogue(outing.dialogueMiddle, 'story.outing.dialogueMiddle'),
      dialogueOutro: parseDialogue(outing.dialogueOutro, 'story.outing.dialogueOutro'),
      message: parseMessage(outing.message, 'story.outing.message'),
      photo: parsePhoto(outing.photo, 'story.outing.photo', photoPathPolicy),
    },
    preparation: {
      date: requireDate(preparation.date, 'story.preparation.date'),
      processingObjectiveText: requireText(
        preparation.processingObjectiveText,
        'story.preparation.processingObjectiveText',
      ),
      processingTaskLabel: requireText(
        preparation.processingTaskLabel,
        'story.preparation.processingTaskLabel',
      ),
      placementObjectiveText: requireText(
        preparation.placementObjectiveText,
        'story.preparation.placementObjectiveText',
      ),
      placementTaskLabel: requireText(
        preparation.placementTaskLabel,
        'story.preparation.placementTaskLabel',
      ),
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
      photo: parsePhoto(preparation.photo, 'story.preparation.photo', photoPathPolicy),
    },
    journey: {
      date: requireDate(journey.date, 'story.journey.date'),
      assemblyObjectiveText: requireText(
        journey.assemblyObjectiveText,
        'story.journey.assemblyObjectiveText',
      ),
      assemblyTaskLabel: requireText(
        journey.assemblyTaskLabel,
        'story.journey.assemblyTaskLabel',
      ),
      placementObjectiveText: requireText(
        journey.placementObjectiveText,
        'story.journey.placementObjectiveText',
      ),
      placementTaskLabel: requireText(
        journey.placementTaskLabel,
        'story.journey.placementTaskLabel',
      ),
      transition: parseTransition(journey.transition, 'story.journey.transition'),
      dialogueIntro: parseDialogue(journey.dialogueIntro, 'story.journey.dialogueIntro'),
      dialogueReady: parseDialogue(journey.dialogueReady, 'story.journey.dialogueReady'),
      dialogueOutro: parseDialogue(journey.dialogueOutro, 'story.journey.dialogueOutro'),
      photo: parsePhoto(journey.photo, 'story.journey.photo', photoPathPolicy),
    },
    ending: {
      date: requireDate(ending.date, 'story.ending.date'),
      transition: parseTransition(ending.transition, 'story.ending.transition'),
      card: parsePhoneCard(ending.card, 'story.ending.card'),
      dialogueIntro: parseDialogue(ending.dialogueIntro, 'story.ending.dialogueIntro'),
      dialogueFinal: parseDialogue(ending.dialogueFinal, 'story.ending.dialogueFinal'),
      message: parseMessage(ending.message, 'story.ending.message'),
      photo: parsePhoto(ending.photo, 'story.ending.photo', photoPathPolicy),
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

function parsePhoto(
  value: unknown,
  path: string,
  policy: CampaignPhotoPathPolicy,
): StoryPhotoContent {
  const photo = requireRecord(value, path);
  const src = requireText(photo.src, `${path}.src`);
  if (!isValidPhotoPath(src, policy)) {
    const requirement = policy === 'private-photos-only'
      ? 'a normalized path under /private/photos/'
      : 'a repository-local absolute path';
    throw new Error(`${path}.src must be ${requirement}.`);
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

function isValidPhotoPath(value: string, policy: CampaignPhotoPathPolicy): boolean {
  const decodedPath = decodePath(value);
  if (
    decodedPath === null
    || !decodedPath.startsWith('/')
    || decodedPath.startsWith('//')
    || decodedPath.includes('\\')
    || decodedPath.includes('?')
    || decodedPath.includes('#')
  ) {
    return false;
  }
  const segments = decodedPath.split('/');
  if (segments.includes('.') || segments.includes('..')) {
    return false;
  }

  const normalized = new URL(decodedPath, 'https://local.invalid');
  if (normalized.origin !== 'https://local.invalid') {
    return false;
  }
  return policy === 'repository-local'
    || normalized.pathname.startsWith('/private/photos/');
}

function decodePath(value: string): string | null {
  let decoded = value;
  try {
    for (let index = 0; index < 4; index += 1) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) {
        return decoded;
      }
      decoded = next;
    }
  } catch {
    return null;
  }
  return /%[0-9a-f]{2}/i.test(decoded) ? null : decoded;
}
