# UR_Game Phase 7 Specification

## Review baseline

- Repository: `Uzy03/UR_Game`
- Phase 6 branch: `codex/phase-6-checkpoint-save`
- Phase 6 commit: `66f2af54f33e90c9747e982d96bc7f0042ab9591`
- Phase 6 package version: `0.6.0`
- Recommended Phase 7 branch: `codex/phase-7-prologue-slice`
- Target package version: `0.7.0`

The Phase 6 review found no blocking issue. The minimal save format, canonical
checkpoint reconstruction, restore ordering, strict authored-content validation,
and subsystem boundaries are suitable for Phase 7.

The one incomplete browser path is not a code blocker. As an additional Phase 6
acceptance test, run this once before or during Phase 7 regression testing:

```text
New Game
  -> complete the delivery task naturally
  -> finish the outro
  -> save Checkpoint B
  -> reload
  -> Continue
  -> resume in demo-garden
```

## 1. Goal

Build the first short, fictional, playable vertical slice using the Phase 0-6
systems. The slice should prove the final game's main loop end to end:

```text
Start Menu
  -> story-owned Phone interaction
  -> Scene transition
  -> NPC dialogue and movement
  -> Overcooked-style placement task
  -> Message and Photo unlock
  -> safe Checkpoint
  -> Continue
```

The slice should take roughly 2-4 minutes. It is a pipeline and usability proof,
not final anniversary content.

Phase 7 adds only one engine primitive: a `phone_story` Event that presents one
Phone card and waits for its HTML button to be pressed. All other progression must
be composed from existing Events and systems.

## 2. Player experience

New Game begins in a small fictional bedroom diorama. A short introduction opens a
story-owned Phone presentation containing a fictional matching-app-style card.

The player presses a button such as `View Match`, sees a second fictional invitation
card, and confirms it. The Phone presentation closes and the EventRunner continues.
It unlocks an archive Message, sets an objective, and moves to a fictional cafe.

At the cafe, the player meets one NPC, advances a short Dialogue, watches the NPC
move to a table, then carries two drinks to two PlacePoints using the existing
PlacementTask. Success unlocks a placeholder Photo, clears the objective, runs an
outro, and saves a safe cafe Checkpoint. Normal exploration then resumes, and the
player can open Messages and Album with `F` to inspect the unlocked fictional
content.

## 3. Non-goals

Do not implement any of the following in Phase 7:

- Real names, dates, messages, photos, locations, or other personal data.
- A real matching-app clone, profiles, swipes, matching logic, or notifications.
- Dialogue choices, branching, conversation trees, affection, or relationship state.
- Chapters, chapter selection, save slots, or a new Save schema.
- New Task types, cooking, recipes, scoring, stars, or difficulty systems.
- Map, calendar, settings, or other Phone apps.
- BGM, sound effects, fades, cinematic cameras, or cutscene cameras.
- GLTF loading, character animation, or a general asset pipeline.
- Gamepad, touch input, mobile layout polish, or final visual polish.
- Actual anniversary story or memory data.

## 4. Responsibility boundaries

### Engine

- `PhoneStoryCard` describes a generic one-button story presentation. It has no
  matching, dating, or cafe semantics.
- `PhoneUI` renders the card and reports its action button once.
- `PhoneController` owns mutual exclusion between normal Phone navigation and a
  story presentation. It does not advance EventRunner directly.
- `EventRunner` owns `phone_story` lifetime and waits for its completion callback.
- `CheckpointRegistry` validates `phone_story` data when validating checkpoint
  resume sequences.
- `Game` remains the composition root and only wires content and dependencies.

### Content

- Bedroom/cafe layouts, dialogue text, card copy, Message, Photo, Task, sequence,
  and Checkpoint definitions live under `src/content/demo/`.
- Story order lives in an `EventSequence`, never in `Game.ts` conditionals.
- All Phase 7 content is obviously fictional and replaceable later.

### Unchanged boundaries

- `SceneManager` still swaps a `SceneDefinition`; it gains no story logic.
- `PhysicsWorld` gains no Phase 7 API.
- `PlacementTask` remains the only Task implementation used by the slice.
- `InputManager` and `KeyboardInput` gain no new action.
- `PhoneProgressSnapshot` remains archive/global progress only.
- `GameSaveDataV1` remains a checkpoint ID only.

## 5. Core types and APIs

Add the generic card type to `src/phone/PhoneTypes.ts`:

```ts
export interface PhoneStoryCard {
  readonly id: string;
  readonly appLabel: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly body: string;
  readonly actionLabel: string;
}
```

Add one Event type to `src/events/EventTypes.ts` and the `GameEvent` union:

```ts
export interface PhoneStoryEvent {
  readonly type: 'phone_story';
  readonly card: PhoneStoryCard;
}
```

Do not add a dating profile, swipe, notification, choice, or conversation domain
model. A card displays text and completes through one button.

Keep the EventRunner boundary narrow by introducing an interface equivalent to:

```ts
export interface PhoneStoryActions {
  presentStoryCard(
    card: PhoneStoryCard,
    onComplete: () => void,
  ): boolean;
  cancelStoryPresentation(): void;
}
```

`EventRunner` depends on `PhoneStoryActions`, not on localStorage or story content.
`PhoneController` may implement this interface.

## 6. Phone presentation modes

Normal and story presentations must be mutually exclusive. Model the internal
controller state explicitly, for example:

```ts
type PhonePresentationMode = 'closed' | 'normal' | 'story';
```

The exact private representation may differ, but behavior must be:

| Mode | Owner | Opens with | Can close with `F`/Escape | Control restoration |
| --- | --- | --- | --- | --- |
| Normal | Player | `F` while allowed | Yes | PhoneController restores captured states |
| Story | EventRunner | `phone_story` | No | EventRunner owns world lock/restore |

Requirements:

- `open()` succeeds only from `closed` and only when the existing `canOpen()` allows it.
- `presentStoryCard()` succeeds only when a story card can safely take ownership.
- If normal Phone is open before a story starts, close it safely before presenting,
  or guarantee the existing EventRunner/restore cleanup already closed it.
- Story presentation must not capture or restore Player/Interaction enabled states.
  EventRunner already owns those states for the running sequence.
- `F` cannot switch from a story card to normal Phone.
- Escape cannot dismiss a story card or skip its Event.
- The action button hides/completes the card before invoking `onComplete` and must
  ignore double clicks.
- `cancelStoryPresentation()` is idempotent, hides the story UI without invoking the
  completion callback, and returns focus safely when appropriate.
- Existing normal `F -> Home -> Messages / Album` behavior remains unchanged.

`PhoneScreen` may gain `'story'` for rendering, but story presentation state must not
be stored in `PhoneProgressSnapshot`.

## 7. Phone UI

Extend the existing `PhoneUI`; do not create a second overlay. Add an operation
equivalent to:

```ts
renderStoryCard(card: PhoneStoryCard, onAction: () => void): void;
```

The existing Phone shell should show:

- `appLabel`
- `title`
- optional `subtitle`
- `body`
- one `actionLabel` button

Hide or disable Back and Close while the story card owns the Phone. Use the current
DOM-building style and add only the CSS required for a clear, phone-sized card.
The existing constructor's required-element checks remain the startup failure path.

## 8. EventRunner integration

Add `phoneStory: PhoneStoryActions` to the dependencies. `phone_story` behaves as an
asynchronous callback-driven Event, like Dialogue:

```text
begin phone_story
  -> setGameplayEnabled(false)
  -> phoneStory.presentStoryCard(card, guarded callback)
  -> wait across game-loop updates
  -> action button invokes callback
  -> completeCurrentEvent()
```

The callback must capture the started event index and only complete if the runner is
still running the same started Event. A late callback after reset/cancel must be
ignored. If presentation returns `false` or throws, use the existing
`failCurrentEvent()` path.

Do not use a Promise chain or add a parallel runner. Add the new Event to the update
switch as a callback-completed Event.

All cleanup paths must cancel the story presentation:

- Event completion.
- `EventRunner.cancel()`.
- `EventRunner.reset()`.
- EventRunner error.
- `EventRunner.dispose()`.
- New Game, Continue restoration, and Reset Progress through their existing runner
  reset path.
- Game disposal.

Use the existing centralized cleanup path. In `Game.dispose()`, dispose EventRunner
before PhoneController, or otherwise guarantee that runner cleanup never calls an
already-disposed Phone UI.

## 9. Authored-content validation

Extend the existing `CheckpointRegistry.validateEvent()` switch for
`phone_story`. Require trimmed, non-empty values for:

- `card.id`
- `card.appLabel`
- `card.title`
- `card.body`
- `card.actionLabel`

If present, `subtitle` must be a string; an empty subtitle may be treated as absent
or rejected consistently. Validation belongs in the authored-content validator,
not in `Game.ts`.

## 10. Demo content and files

Recommended additions:

```text
public/demo/phase7-cafe-placeholder.svg
src/content/demo/phase7Checkpoints.ts
src/content/demo/phase7PhoneContent.ts
src/content/demo/phase7PhoneStory.ts
src/content/demo/phase7Scenes.ts
src/content/demo/phase7Sequence.ts
```

Recommended engine changes:

```text
src/core/Game.ts
src/events/EventRunner.ts
src/events/EventTypes.ts
src/interaction/PickableItem.ts
src/phone/PhoneController.ts
src/phone/PhoneTypes.ts
src/save/CheckpointRegistry.ts
src/style.css
src/ui/phone/PhoneUI.ts
package.json
package-lock.json
README.md
```

Adjust the exact list only when the current implementation makes it unnecessary.
Do not create story-specific engine classes such as `MatchingApp`, `DatingProfile`,
`FirstDateController`, or `CafeStoryManager`.

## 11. Scene definitions

Add two scenes using the existing `SceneDefinition`, `StageDefinition`,
`SceneContentRegistry`, `SceneRuntime`, and `SceneManager`.

### `demo-bedroom`

- A small room-style floor and walls.
- Primitive bed/table-like obstacles.
- No NPC is required.
- A safe Player spawn with no collider overlap.

### `demo-cafe`

- Primitive cafe tables/counter.
- One fictional NPC, for example `demo-partner`.
- Two `drink` PickableItems.
- Two reachable target PlacePoints on a table/counter.
- A safe Player spawn and a clear path to both items and targets.

If the existing item kinds cannot communicate a drink clearly, extend
`PickableItemKind` with only `'drink'`. Add its footprint radius and a simple
primitive cup visual. This is a visual kind, not a new mechanic or physics mode.

Use one existing `ScenePlacementTaskDefinition`:

```text
id: demo-cafe-drinks
label: Bring both drinks to the cafe table
required items: demo-drink-1, demo-drink-2
targets: cafe-table-left, cafe-table-right
duration: 30-45 seconds
```

The Task attempt spawn must be safe, and `prepareAttempt()` must restore both drinks,
both PlacePoints, Carry state, and Player pose through existing behavior.

## 12. Phone content

Create one fictional thread with enough Messages to make the unlocked archive
meaningful, plus one fictional Photo definition. Use neutral labels such as
`Demo Partner`, a clearly invented app label such as `PairUp`, and a generic date.

The Photo must use a repository-owned, hand-authored placeholder SVG such as
`/demo/phase7-cafe-placeholder.svg`. It must contain no real person, metadata,
external URL, trademarked app UI, or identifying place.

Treat Phone Story Cards as transient story presentation and Messages as the archive
the player can revisit. They do not need automatic synchronization beyond explicit
`unlock_message` Events.

Compose the Phase 7 Phone content with the Phase 4 demo definitions rather than
deleting legacy IDs. This keeps existing Phase 6 Checkpoint Phone snapshots valid.

## 13. Main sequence

The Phase 7 main sequence should be equivalent to:

```text
START
  -> set_date(fictional YYYY-MM-DD)
  -> set_objective("Check your phone.")
  -> phone_story(fictional match notification)
  -> phone_story(fictional cafe invitation)
  -> unlock_message(fictional conversation archive; repeat for each authored message)
  -> set_objective("Meet at the cafe.")
  -> change_scene(demo-cafe)
  -> dialogue(short first meeting, including Player lines in the existing format)
  -> move_npc(demo-partner toward the table)
  -> dialogue(short follow-up)
  -> set_objective("Bring both drinks to the table.")
  -> speech(short fictional prompt)
  -> task(demo-cafe-drinks)
  -> unlock_photo(fictional placeholder)
  -> set_objective(null)
  -> dialogue(short outro)
  -> set_checkpoint(phase7-cafe-after-meeting)
  -> speech(short closing line)
  -> wait(short delay)
END -> exploration
```

Use the existing `DialogueLine` shape for both NPC and Player lines. Do not create a
Player-specific dialogue system.

## 14. Checkpoints and backward compatibility

Add:

### `phase7-prologue-start`

- Scene: `demo-bedroom`.
- Phone progress: empty v1 snapshot.
- Resume sequence: the Phase 7 main sequence from event index zero.

### `phase7-cafe-after-meeting`

- Scene: `demo-cafe`.
- Phone progress: fictional date, all Phase 7 archive Messages and Photo unlocked,
  and `currentObjective: null`.
- Resume sequence: a short post-meeting sequence or `null`; it must never replay the
  task or unlock flow.

Change only `GameProgressController.initialCheckpointId` wiring so New Game begins at
`phase7-prologue-start`.

Keep Phase 5 scenes, Phase 4 Phone content, and Phase 6 Checkpoints registered along
with the new content. This preserves Continue for existing local saves that contain
`demo-room-start` or `demo-garden-after-delivery`. Phase 7 content becomes the New
Game baseline without changing the v1 storage schemas.

Do not persist Phone Story card ID, button state, Event index, Dialogue line, Task
state, timer, Carry, item positions, or physics state. Reload during the prologue or
cafe Task resumes the canonical prior Checkpoint from the beginning.

Keep unchanged:

```text
ur-game:save:v1
{ version: 1, checkpointId }

ur-game:phone-progress:v1
PhoneProgressSnapshot.version === 1
```

## 15. Input and locking

Add no keyboard action. Keep:

- `WASD`: movement when enabled.
- `E` / `Space`: Interact and Dialogue advance where already supported.
- `R`: Task retry.
- `F`: normal Phone toggle during exploration only.
- `Escape`: normal Phone back/close only.

Expected availability:

| State | Movement | Interaction/NPC | Normal Phone | Story action |
| --- | --- | --- | --- | --- |
| Start Menu | Off | Off | Off | None |
| `phone_story` | Off | Off | Off | HTML button only |
| Dialogue/movement/wait | Off | Off | Off | Existing behavior |
| Task | On | On | Off | Existing behavior |
| Exploration | On | On | On | None |

Do not add another global input-lock manager. Reuse EventRunner's ownership of world
controls and PhoneController's existing normal-Phone capture/restore behavior.

## 16. Error and fallback behavior

- A missing required Phone DOM element may fail clearly during UI construction.
- Invalid authored card data must fail at registry construction.
- A story presentation that cannot start must put EventRunner into its existing
  `error` state and restore world controls through centralized cleanup.
- Story UI must not remain visible after completion, cancel, reset, error, restore,
  menu return, or disposal.
- A stale or double-fired completion callback must not skip an Event.
- Scene loading and Rapier behavior remain unchanged.
- If a v1 Save contains an unknown Checkpoint, Continue remains unavailable through
  the existing safe fallback.

## 17. Completion criteria

### Vertical slice

- New Game starts `demo-bedroom` at the Phase 7 prologue.
- At least two Phone Story Cards run consecutively through button input.
- The runner continues after story Phone completion.
- Fictional Message content unlocks.
- Scene changes to `demo-cafe`.
- First-meeting Dialogue and NPC movement complete.
- Two drinks can be carried to two PlacePoints.
- Timeout and `R` retry restore a clean attempt.
- Success unlocks a fictional Photo, runs the outro, and saves the cafe Checkpoint.
- Sequence completion returns to exploration.

### Phone and Save

- Story and normal Phone presentations never overlap.
- `F` and Escape cannot break a Story Card Event.
- Normal Phone still works during exploration and shows the new Message/Photo.
- Reload during Phone Story or Task resumes the safe prologue Checkpoint.
- Reload after the final Checkpoint resumes directly in the cafe without replaying
  the slice.
- Legacy Phase 6 checkpoint IDs remain resolvable.
- Game Save v1 and Phone Progress v1 remain unchanged.

### Architecture and quality

- `phone_story` is the only new Event primitive.
- No new Task type or story-specific engine class exists.
- Story order is absent from `Game.ts`.
- `SceneManager` has no new story responsibility.
- `PhysicsWorld` has no Phase 7 change unless a verified regression requires one.
- `npm run build` succeeds.
- `git diff --check` succeeds.
- Phase 0-6 movement, collision, interaction, Task, Phone, scene swap, and Continue
  behavior have no regression.
- Secret/personal-data scan finds no sensitive content.

## 18. Required browser tests

Run these in a real browser at the project's standard preview URL:

1. Happy path:
   `Reset Progress -> New Game -> both cards -> cafe -> dialogue -> Task -> CLEAR ->
   Photo -> outro -> Checkpoint -> exploration -> F -> Messages -> Album`.
2. Story reload:
   reload on the second card, choose Continue, and confirm the prologue restarts.
3. Task retry:
   reach TIME UP, press `R`, and confirm Player, drinks, Carry, and targets reset.
4. Task reload:
   place one drink, reload, choose Continue, and confirm partial placement is gone.
5. Final Checkpoint:
   finish the slice, reload, Continue, and confirm direct safe cafe resume.
6. Phone exclusion:
   `F` does not open normal Phone during Story or Task, but does during exploration;
   Escape does not dismiss a Story Card.
7. Phase 0 regression:
   WASD changes position, diagonal speed remains normalized, facing follows movement,
   camera follows, and walls/obstacles still block the Player.
8. Phase 6 legacy acceptance:
   when practical, complete the old delivery path once and confirm Checkpoint B
   reload/Continue. This remains additional verification, not a Phase 7 code gate
   unless it exposes a real defect.

## 19. Implementation report

Report the following after Phase 7 implementation:

- Added and changed files, branch, commit, and package version.
- Final `PhoneStoryCard` and `PhoneStoryEvent` types.
- The narrow Phone Story API supplied to EventRunner.
- Normal/story Phone exclusion and control restoration behavior.
- Callback waiting, stale-callback guard, and cleanup behavior.
- Scene, Task, Phone content, main sequence, and Checkpoint definitions.
- How old Phase 6 save/checkpoint IDs remain compatible.
- Confirmation that both storage schemas remain v1.
- Confirmation that `phone_story` is the only new Event and no new Task type exists.
- `npm run build`, `git diff --check`, browser test, and privacy-scan results.
- Any non-blocking limitations that should inform Phase 8.

## 20. Phase 8 boundary

Do not begin Phase 8 while implementing this specification. Review the playable
vertical slice first. Only after the complete loop feels coherent should the project
decide whether Phase 8 is content production, presentation polish, audio, asset
loading, or another narrowly justified gap.

Do not add real personal content to the public repository in Phase 7. Later private
content must be isolated behind ignored/private data files or a separate secure
content pipeline before any real names, messages, dates, photos, or locations are
introduced.
