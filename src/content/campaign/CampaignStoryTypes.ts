import type { DialogueLine } from '../../dialogue/DialogueTypes';

export interface StoryPhoneCardText {
  readonly appLabel: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly body: string;
  readonly actionLabel: string;
}

export interface StoryMessageContent {
  readonly sender: string;
  readonly text: string;
  readonly timeLabel: string;
}

export interface StoryPhotoContent {
  readonly src: string;
  readonly alt: string;
  readonly caption: string;
  readonly date: string;
}

export interface StoryTransitionContent {
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle?: string;
}

export type StoryDialogueLines = readonly DialogueLine[];

export interface CampaignStoryDefinition {
  readonly companionDisplayName: string;
  readonly phoneThreadTitle: string;
  readonly prologue: {
    readonly date: string;
    readonly checkPhoneObjectiveText: string;
    readonly meetObjectiveText: string;
    readonly connectionCard: StoryPhoneCardText;
    readonly invitationCard: StoryPhoneCardText;
    readonly invitationMessage: StoryMessageContent;
  };
  readonly meeting: {
    readonly date: string;
    readonly placementObjectiveText: string;
    readonly placementTaskLabel: string;
    readonly transition: StoryTransitionContent;
    readonly dialogueIntro: StoryDialogueLines;
    readonly dialogueOutro: StoryDialogueLines;
    readonly photo: StoryPhotoContent;
  };
  readonly outing: {
    readonly date: string;
    readonly firstReachObjectiveText: string;
    readonly firstReachTaskLabel: string;
    readonly secondReachObjectiveText: string;
    readonly secondReachTaskLabel: string;
    readonly transition: StoryTransitionContent;
    readonly dialogueIntro: StoryDialogueLines;
    readonly dialogueMiddle: StoryDialogueLines;
    readonly dialogueOutro: StoryDialogueLines;
    readonly message: StoryMessageContent;
    readonly photo: StoryPhotoContent;
  };
  readonly preparation: {
    readonly date: string;
    readonly processingObjectiveText: string;
    readonly processingTaskLabel: string;
    readonly placementObjectiveText: string;
    readonly placementTaskLabel: string;
    readonly transition: StoryTransitionContent;
    readonly dialogueIntro: StoryDialogueLines;
    readonly dialogueReady: StoryDialogueLines;
    readonly dialogueOutro: StoryDialogueLines;
    readonly message: StoryMessageContent;
    readonly photo: StoryPhotoContent;
  };
  readonly journey: {
    readonly date: string;
    readonly assemblyObjectiveText: string;
    readonly assemblyTaskLabel: string;
    readonly placementObjectiveText: string;
    readonly placementTaskLabel: string;
    readonly transition: StoryTransitionContent;
    readonly dialogueIntro: StoryDialogueLines;
    readonly dialogueReady: StoryDialogueLines;
    readonly dialogueOutro: StoryDialogueLines;
    readonly photo: StoryPhotoContent;
  };
  readonly ending: {
    readonly date: string;
    readonly transition: StoryTransitionContent;
    readonly card: StoryPhoneCardText;
    readonly dialogueIntro: StoryDialogueLines;
    readonly dialogueFinal: StoryDialogueLines;
    readonly message: StoryMessageContent;
    readonly photo: StoryPhotoContent;
    readonly completionSpeech: string;
    readonly resumeSpeech: string;
  };
}
