# UR_Game Phase 12 — Campaign Presentation & Content-Authoring Readiness

## Baseline

- Phase 11 branch: `codex/phase-11-campaign-skeleton`
- Phase 11 commit: `b90b814517f11d231a56a44998f770be68728efe`
- Phase 12 branch: `codex/phase-12-presentation`
- Package version: `0.12.0`

## Purpose

Phase 12 adds a minimal presentation layer to the fictional linear Campaign. Its only new experience is a short full-screen memory card between major story segments:

```text
previous segment
→ CSS fade and fictional date/title card
→ change_scene
→ set_date
→ next segment
```

It does not add gameplay, chapters, branching, audio, assets, or real anniversary content.

## New presentation capability

`transition_card` is the only new `GameEvent`:

```ts
interface TransitionCardDefinition {
  readonly id: string;
  readonly eyebrow?: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly durationSeconds: number;
}
```

The event only displays presentation and waits for its data-driven duration. It does not change Scene, Phone progress, Checkpoint, or Save data.

`EventRunner` advances the event with its existing `deltaSeconds` update path. It does not use `setTimeout`, `setInterval`, async sleep, or a Promise timer chain. The existing running state locks player movement, Interaction, NPC interaction, and the normal Phone.

`TransitionActions` separates EventRunner from DOM/CSS:

```ts
interface TransitionActions {
  show(card: TransitionCardDefinition): void;
  hide(): void;
}
```

`TransitionOverlay` implements that interface with existing HTML/CSS UI conventions. Its CSS animation performs the fade-in, readable hold, and fade-out within `durationSeconds`; the WebGL renderer and Three.js Scene are unchanged.

## Cleanup policy

The overlay is hidden through EventRunner's common cleanup path on:

- normal event completion
- cancel
- reset
- error
- dispose
- New Game, Continue, and Reset Progress restoration

EventRunner tracks whether it owns a visible transition so `hide()` is idempotent from the presentation boundary's perspective.

## Validation

Every Transition Card requires:

- a non-empty ID
- a non-empty title
- non-empty eyebrow and subtitle when present
- a finite `durationSeconds` greater than zero

The shared validation is used both when a card begins at runtime and while Checkpoint resume sequences are registered.

## Campaign cards

All five definitions are fictional content in `src/content/campaign/campaignTransitionCards.ts`:

| ID | Segment | Title |
| --- | --- | --- |
| `campaign-card-meeting` | Meeting | First Demo Meeting |
| `campaign-card-outing` | Outing | A Quiet Walk |
| `campaign-card-preparation` | Preparation | Getting Ready |
| `campaign-card-journey` | Journey | A Small Journey |
| `campaign-card-ending` | Ending | One Last Memory |

Cards are part of the canonical segment arrays. Main and resume sequences remain suffixes of the same source arrays, so Checkpoint-specific copies are not created.

## Architecture kept unchanged

- `SceneManager` does not know presentation.
- `SceneDefinition` has no date, title, chapter, or transition fields.
- Task, Physics, Input, and camera code are unchanged.
- There is no Chapter, SegmentManager, CampaignManager, or StoryGraph.
- Campaign text remains under `src/content/campaign/`, not `Game.ts`.

## Save and privacy

Game Save remains `ur-game:save:v1` with `{ version: 1, checkpointId }`. Phone Progress remains `ur-game:phone-progress:v1`. Transition ID, visibility, and elapsed time are not saved. Reloading during a card resumes from the preceding safe Checkpoint and restarts the canonical next-segment card.

All card dates, titles, and locations are fictional placeholders. The public repository must not contain real names, dates, messages, photos, locations, relationship details, credentials, tokens, API keys, or private keys.

## Automated verification

The implementation agent does not open or operate the game site. Verification consists of:

```bash
npm run build
git diff --check
```

plus browser-free checks for:

- Transition Card duration and completion using fake `TransitionActions`
- cancel/reset/error/dispose cleanup
- invalid card rejection
- five valid Campaign cards and canonical resume suffixes
- all legacy Checkpoint resolution
- unchanged Save/Phone v1 keys and schemas
- absence of secret and personal-data candidates

## Manual acceptance

The user verifies in the browser:

1. Reset Progress → New Game still begins with the Phone Story.
2. Meeting, Outing, Preparation, Journey, and Ending each show one readable card.
3. Every card fades in/out, completes automatically, and restores controls.
4. Input, Phone, and underlying UI cannot be used during a card.
5. No Dialogue, prompt, Task result, Phone, marker, Station, NPC, or Item remains over the card or leaks into the next Scene.
6. Continue from each Campaign Checkpoint shows the next Segment's card and reaches its canonical Scene.
7. Reloading during a card returns to the preceding safe Checkpoint without a stuck overlay.
8. The full WASD, Interaction, Processing, Assembly, Retry, Message, Album, and Ending flow remains functional.
