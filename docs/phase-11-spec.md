# UR_Game Phase 11 — Fictional Full Campaign Skeleton

## Baseline

- Phase 10 branch: `codex/phase-10-combining`
- Phase 10 commit: `1c16880e7052afec066081a3f8a1239c168c545b`
- Phase 11 branch: `codex/phase-11-campaign-skeleton`
- Package version: `0.11.0`

## Purpose

Phase 11 connects the existing story and gameplay systems into one fictional linear campaign. It validates pacing, Scene transitions, Phone progression, safe Checkpoint resume, and the distribution of existing mechanics before any real anniversary content is introduced.

No new engine primitive is part of this phase.

## Campaign flow

```text
Prologue
  campaign-bedroom
  Phone Story ×2
  Message unlock

Meeting
  campaign-cafe
  Dialogue → Placement → Photo → Checkpoint

Outing
  campaign-park
  Reach → Dialogue → Reach → Photo/Message → Checkpoint

Preparation
  campaign-prep-space
  Processing → Placement → Photo/Message → Checkpoint

Journey
  campaign-viewpoint
  Assembly → Placement → Photo → Checkpoint

Ending
  campaign-ending-room
  Phone Story → Dialogue → Photo/Message → final Checkpoint
```

The target is a 20–30 minute experience. Phase 11 establishes the structure; measured pacing is adjusted only after the user completes a manual playthrough.

## Existing primitives used

Story:

- `phone_story`
- `dialogue`
- `move_npc`
- `speech`
- `wait`
- `set_date`
- `set_objective`
- `unlock_message`
- `unlock_photo`
- `change_scene`
- `set_checkpoint`

Gameplay:

- `PlacementTask`
- `ReachZoneTask`
- `ProcessingTask`
- `AssemblyTask`

Explicitly not added:

- Chapter or Campaign runtime types
- New `GameEvent`
- New `Task`
- Branching, choices, inventory, or quest systems
- Save v2, save slots, or world snapshots
- Audio, cinematics, GLTF, animation, gamepad, or touch controls

## Content organization

Campaign content lives under `src/content/campaign/`:

```text
campaignIds.ts
campaignScenes.ts
campaignPhoneContent.ts
campaignPhoneStory.ts
campaignSequences.ts
campaignCheckpoints.ts
campaignContent.ts
```

`campaignContent.ts` is a static bundle. It combines the legacy Phase 6–10 definitions with the Phase 11 definitions for Registry construction. It does not own runtime state.

## Canonical event sequence

Each segment owns its event text once in `campaignSequences.ts`. The main sequence and every resumable Checkpoint sequence are generated from a suffix of the ordered segment list.

```text
main                  = Prologue + Meeting + Outing + Preparation + Journey + Ending
after meeting resume  = Outing + Preparation + Journey + Ending
after outing resume   = Preparation + Journey + Ending
after prep resume     = Journey + Ending
before ending resume  = Ending
```

This prevents long event bodies from being copied into every Checkpoint definition. It is content composition, not a new sequence engine.

## Checkpoints

| Checkpoint | Canonical Scene | Phone progression | Resume point |
| --- | --- | --- | --- |
| `campaign-start` | `campaign-bedroom` | 0 messages / 0 photos | Prologue |
| `campaign-after-meeting` | `campaign-cafe-complete` | 1 message / 1 photo | Outing |
| `campaign-after-outing` | `campaign-park` | 2 messages / 2 photos | Preparation |
| `campaign-after-preparation` | `campaign-prep-space-complete` | 3 messages / 3 photos | Journey |
| `campaign-before-ending` | `campaign-viewpoint-complete` | 3 messages / 4 photos | Ending |
| `campaign-complete` | `campaign-ending-room` | 4 messages / 5 photos | Quiet completed state |

Completed Scene definitions are used only where Item placement, processing, or active state must be reconstructed:

- `campaign-cafe-complete`
- `campaign-prep-space-complete`
- `campaign-viewpoint-complete`

Reach and dialogue-only progress does not require a duplicate Scene.

## Save policy

Game Save remains:

```ts
{
  version: 1,
  checkpointId: string,
}
```

Phone Progress remains version 1. Campaign index, Task progress, Player position, Carry state, Station state, and EventRunner index are not persisted. A Checkpoint reconstructs a safe Scene, canonical Phone snapshot, and remaining Event suffix.

All Phase 6–10 Checkpoints, Scenes, and Phone definitions stay registered.

## Privacy

All Phase 11 dates, names, messages, locations, dialogue, and SVG images are fictional placeholders. The public repository must not contain real names, dates, messages, photos, locations, credentials, tokens, API keys, or private relationship data.

The five images in `public/campaign/` are repository-owned SVG placeholders with no external URL dependency.

## Automated verification

The implementation agent does not open or operate the game site. Verification consists of:

```bash
npm run build
git diff --check
```

plus browser-free checks for:

- all Campaign and legacy Scene/Checkpoint resolution
- Checkpoint Phone snapshot validity and monotonic progression
- valid Scene, Task, NPC, Message, Photo, and Checkpoint event references
- canonical suffix relationships between resume sequences
- placeholder SVG syntax
- absence of secret and personal-data candidates

## Manual acceptance

The user performs the browser playthrough and checks:

1. Reset Progress → New Game starts the Prologue.
2. Phone Story leads naturally into the Cafe.
3. Cafe Placement clears and unlocks the first Photo.
4. Both Park Reach markers work and disappear after success.
5. Processing hands processed Items to Placement.
6. Assembly hands its output Item to Placement.
7. Mid-campaign Continue loads canonical Scenes and Phone progress.
8. Reloading during Processing or Assembly returns to the preceding safe Checkpoint.
9. Album and Messages grow without future content appearing early.
10. Ending Continue preserves the final canonical state.
11. The approximate duration, Retry count, slow sections, difficult Tasks, and good pacing are recorded for Phase 12.
