# UR_Game Phase 6 Specification

## Review baseline

- Repository: `Uzy03/UR_Game`
- Phase 5 branch: `feature/phase-5-multi-scene`
- Phase 5 commit: `88fc878ab9c15fee92207569b60c9276d3503185`
- Phase 5 review result: no blocking issue was found; Phase 6 may proceed.

The Phase 5 scene lifecycle, live-object ownership, registry replacement, Rapier
cleanup, Carry/Interaction rebinding, EventRunner boundary, and Phone Progress v1
compatibility are suitable for the next phase.

One non-blocking limitation should remain documented: `SceneManager.loadScene()`
constructs the candidate runtime before detaching the current scene, but an exception
during installation after detach does not restore the old scene. Current synchronous
installation operations are not expected to throw, so this does not block Phase 6.
Revisit transactional replacement only when async loading or fallible asset setup is
introduced.

## 1. Goal

Implement the minimum persistence needed by a roughly 30-minute linear game:

```text
reach a safe story point
  -> save its checkpoint ID
  -> close or reload the browser
  -> choose Continue
  -> rebuild a consistent scene and story state from that checkpoint
```

A checkpoint is a **safe story resume point**, not an exact save state. Some progress
since the last checkpoint may be replayed. The restored game must always be
internally consistent.

Phase 6 must implement:

- Checkpoint definitions and validation.
- A versioned, minimal local Game Save containing a checkpoint ID.
- New Game, Continue, and Reset Progress flows.
- A small start menu.
- Phone Progress restoration at the selected checkpoint.
- A single `set_checkpoint` event.
- Two fictional demo checkpoints proving cross-scene resume.

Do not introduce a Chapter concept. It is not needed for the current linear game.

## 2. Explicit non-goals

Do not persist or resume:

- Player or NPC coordinates.
- NPC movement progress.
- Item positions or PlacePoint occupancy.
- The carried item.
- Task progress, timer remainder, or result phase.
- Dialogue line, EventRunner index, or wait remainder.
- Speech, prompt, highlight, overlay, or other transient UI.
- Rapier bodies or any physics snapshot.

Also do not implement:

- Multiple save slots or a manual-save screen.
- Save import/export, cloud save, encryption, or authentication.
- Chapter/select/checkpoint-select UI.
- Save screenshots, play-time tracking, or achievements.
- Generic migration infrastructure before a v2 format exists.
- Fade/loading screens, async loading, asset streaming, or transactional scene swap.
- Branching story, choices, or conditional/goto event systems.
- Real story content, real names, messages, locations, dates, or photos.

## 3. Responsibility boundaries

### `CheckpointDefinition` and content

Describe the canonical state at a safe resume point. Content data owns the mapping
from a checkpoint ID to its scene, Phone state, and optional resume sequence.

### `CheckpointRegistry`

Own immutable checkpoint definitions, validate all of them at startup, and resolve
an ID. It does not load localStorage or mutate the world.

### `GameSaveStore`

Parse, validate, save, and clear the small versioned Game Save. It knows
localStorage but does not know scenes, checkpoints, Phone content, events, or UI.

### `GameProgressController`

Coordinate New Game, Continue, checkpoint saving, Reset Progress, cleanup, scene
loading, Phone replacement, EventRunner startup, and the start menu. It is a small
application/composition layer, not a story engine.

### Existing systems

- `Game` remains the composition root and game-loop owner. It wires the new objects
  but contains no checkpoint-specific conditionals or localStorage parsing.
- `SceneManager` continues to accept only a scene ID and replace a `SceneRuntime`.
  It must not know checkpoint IDs or SaveData.
- `EventRunner` receives only a minimal `CheckpointActions` dependency. It must not
  know `GameSaveStore`, localStorage, or restore flow.
- `PhoneProgress` remains global and does not know scenes or checkpoints.
- `PhoneProgressStore` keeps its Phase 4 storage key and schema.
- `PhoneController` remains global and is closed/disabled while the menu or restore
  flow owns input.
- `PhysicsWorld` gains no persistence API. Scene creation and the existing player
  reset path rebuild physics state.
- `InputManager` and `KeyboardInput` gain no menu-specific key mapping. Native HTML
  buttons are sufficient for Phase 6.

## 4. Core types

Add `src/save/GameSaveTypes.ts`:

```ts
export interface GameSaveDataV1 {
  readonly version: 1;
  readonly checkpointId: string;
}
```

The Game Save must not duplicate scene ID, Phone state, sequence ID, or live-world
state. Those values come from the checkpoint definition.

Add `src/save/CheckpointTypes.ts`:

```ts
import type { EventSequence } from '../events/EventTypes';
import type { PhoneProgressSnapshot } from '../phone/PhoneTypes';

export interface CheckpointDefinition {
  readonly id: string;
  readonly sceneId: string;
  readonly phoneProgress: PhoneProgressSnapshot;
  readonly resumeSequence: EventSequence | null;
}
```

Use `SceneDefinition.playerSpawn`; do not add checkpoint-specific player coordinates
until a real content need exists.

## 5. Storage format

Use a new key:

```text
ur-game:save:v1
```

The serialized format is:

```json
{
  "version": 1,
  "checkpointId": "demo-room-start"
}
```

The existing Phone key and format remain unchanged:

```text
ur-game:phone-progress:v1
PhoneProgressSnapshot.version === 1
```

Phase 6 is the first Game Save format. If `version !== 1`, treat it as unsupported
and make Continue unavailable. Do not silently coerce it and do not build a
migration framework yet.

## 6. `GameSaveStore`

Add `src/save/GameSaveStore.ts` with approximately:

```ts
load(): GameSaveDataV1 | null;
save(data: GameSaveDataV1): void;
clear(): void;
```

`load()` validates that:

- The parsed value is a non-null object.
- `version` is exactly `1`.
- `checkpointId` is a non-empty string.

It does not validate whether the ID is registered; that belongs to the registry or
progress controller.

Malformed JSON, unavailable storage, `SecurityError`, quota failure, and other
storage exceptions must not crash startup or gameplay. Return `null` on load
failure. Swallow save/clear storage exceptions after at most one useful warning.

Do not automatically delete or rewrite malformed/unsupported data.

## 7. `CheckpointRegistry`

Add `src/save/CheckpointRegistry.ts`. Construct it from all checkpoint definitions
and the existing Scene and Phone content registries.

Validate at startup:

- Non-empty and globally unique checkpoint IDs.
- A registered `sceneId`.
- Phone snapshot version `1`.
- A null or real valid calendar date in `YYYY-MM-DD` form.
- A null objective, or non-empty objective ID and text.
- String arrays for message/photo IDs with no unknown Phone content IDs.
- A structurally valid resume sequence and non-empty sequence ID when non-null.

Fail loudly for invalid authored content, including the checkpoint ID and field in
the error. Do not silently filter unknown IDs in a checkpoint definition.

If loaded SaveData refers to an unknown checkpoint, startup still succeeds but
Continue is unavailable.

Avoid copying Phone snapshot validation into several classes. Extract only a small
shared validator/helper if required by `PhoneProgressStore`, `PhoneProgress`, and
`CheckpointRegistry`; do not perform an unrelated Phone refactor.

## 8. Phone Progress replacement

Extend `PhoneProgress` with equivalent public operations:

```ts
replace(snapshot: PhoneProgressSnapshot): void;
reset(): void;
```

`replace()` must:

- Validate version, date, objective, and registered message/photo IDs.
- Copy arrays/objects rather than retaining caller-owned mutable references.
- Fully replace all four Phase 4 fields.
- Save the result through the existing `PhoneProgressStore`.

`reset()` replaces the state with the empty v1 snapshot and persists it.

Checkpoint restoration intentionally rolls Phone progress back to the canonical
checkpoint state. This prevents later message/photo unlocks from surviving when the
world resumes at an earlier checkpoint.

Do not rename the Phase 4 storage key and do not add Scene/Checkpoint data to the
Phone snapshot.

## 9. `set_checkpoint` event

Add one event to `src/events/EventTypes.ts`:

```ts
export interface SetCheckpointEvent {
  readonly type: 'set_checkpoint';
  readonly checkpointId: string;
}
```

Add it to the `GameEvent` union. Give `EventRunner` only:

```ts
export interface CheckpointActions {
  setCheckpoint(checkpointId: string): void;
}
```

On `set_checkpoint`, call the action and complete the event synchronously. The
runner does not parse SaveData or restore a checkpoint.

Place this event explicitly in content sequences only after all effects represented
by that checkpoint are complete. Never save during dialogue, NPC movement, task,
result display, or scene installation. Do not autosave after every event.

If localStorage saving fails, the sequence and gameplay may continue.

## 10. `GameProgressController`

Add `src/save/GameProgressController.ts` or an equivalently named focused class. Its
public surface should remain close to:

```ts
startNewGame(): void;
continueGame(): void;
setCheckpoint(checkpointId: string): void;
resetProgress(): void;
```

It coordinates the registry, store, `SceneManager`, `EventRunner`, `PhoneProgress`,
`PhoneController`, and start menu through narrow dependencies.

### Shared restore cleanup

Before New Game or Continue restores a checkpoint, ensure the existing APIs leave:

- EventRunner reset/cancelled.
- Dialogue closed.
- Active task and result state reset.
- Task HUD and result overlay hidden.
- Speech bubble hidden.
- Phone closed.
- Interaction target/highlight cleared.
- Carry emptied by the existing scene unbind/load path.
- Player movement, Interaction, NPC interaction, and Phone access locked during
  restoration.

Reuse existing cleanup behavior rather than duplicating it in several systems.

### Checkpoint restore order

Use this order:

1. Resolve a validated `CheckpointDefinition`.
2. Reset/cancel EventRunner and close/clear transient UI.
3. Lock movement, interaction, NPC talk, and Phone access.
4. Call `SceneManager.loadScene(checkpoint.sceneId)`.
5. Let the existing scene-load path reset Three.js player state and the Rapier
   kinematic character to `SceneDefinition.playerSpawn`; do not reset twice.
6. Call `PhoneProgress.replace(checkpoint.phoneProgress)`.
7. Restore normal availability expected before the sequence starts.
8. If `resumeSequence` is non-null, start it from event index zero. Otherwise enter
   normal exploration.
9. Hide the start menu only after restore/start succeeds.

Do not resolve the new scene's NPCs or tasks before the scene has loaded.

If scene load or sequence start fails, log one clear error, keep gameplay input
locked, return to the start menu, disable Continue for that attempt, and leave New
Game available. Automatic deletion of the existing Save is not required.

### New Game

New Game must:

1. Run shared cleanup and lock input.
2. Clear `ur-game:save:v1` through `GameSaveStore`.
3. Reset Phone state through `PhoneProgress.reset()`.
4. Restore the registered initial checkpoint.
5. Save that initial checkpoint ID so immediate reload can Continue.
6. Start its resume sequence from the beginning.

This must not retain old Phone unlocks or prior world state.

### Continue

Continue is enabled only when `GameSaveStore.load()` returns valid v1 data and its
checkpoint ID resolves. Restore that checkpoint through the shared restore path.

Never restore EventRunner internals. `resumeSequence`, if present, starts at index
zero. A task starts from `TaskEventBinding.prepareAttempt()`, and Carry starts empty.

### Reset Progress

Reset Progress is needed only when a valid Save exists. It must:

- Stop/reset the current transient flow if applicable.
- Clear Game Save through `GameSaveStore`.
- Clear Phone semantic progress through `PhoneProgress.reset()`.
- Return to or remain on the start menu.
- Refresh Continue/Reset availability.

Other classes must not manipulate the Phone storage key directly.

## 11. Start menu

Add `src/ui/StartMenu.ts` using a small HTML/CSS overlay with native buttons:

```text
Anniversary Game
New Game
Continue
Reset Progress
```

- Show it at startup before any story sequence begins.
- Always allow New Game.
- Disable or hide Continue when no usable Save exists.
- Show Reset Progress only when appropriate.
- While visible: movement off, Interaction off, NPC talk off, Phone unavailable,
  and EventRunner idle.
- Hide it after successful New Game/Continue restoration.
- Mouse click support is sufficient. Do not add keyboard menu actions.
- Use `textContent`/DOM APIs; do not insert content strings with `innerHTML`.

The world may continue rendering as a background while the menu is visible.

Do not add a complex confirmation modal or menu framework in this phase.

## 12. Fictional demo content

Add `src/content/demo/phase6Checkpoints.ts` with at least:

### `demo-room-start`

- Scene: `demo-room`.
- Phone: empty/initial v1 state.
- Resume: the Phase 5 main demo sequence, from its beginning.

### `demo-garden-after-delivery`

- Scene: `demo-garden`.
- Phone: the fictional demo message/photo unlocked, the appropriate fictional date,
  and objective cleared.
- Resume: a short fictional continuation sequence that does not repeat the delivery
  task.

Insert `set_checkpoint` into the Phase 5 flow at a genuinely safe point, for example:

```text
task success
  -> unlock fictional photo
  -> clear objective
  -> completed dialogue
  -> set_checkpoint(demo-garden-after-delivery)
```

All referenced message/photo/scene IDs must already exist in their content
registries. Use only fictional placeholder content.

## 13. Suggested file changes

Add approximately:

```text
src/save/GameSaveTypes.ts
src/save/GameSaveStore.ts
src/save/CheckpointTypes.ts
src/save/CheckpointRegistry.ts
src/save/GameProgressController.ts
src/ui/StartMenu.ts
src/content/demo/phase6Checkpoints.ts
src/content/demo/phase6ResumeSequence.ts   # only if a separate sequence is clearer
```

Modify only as needed:

```text
src/core/Game.ts
src/events/EventTypes.ts
src/events/EventRunner.ts
src/phone/PhoneProgress.ts
src/phone/PhoneProgressStore.ts
src/phone/PhoneTypes.ts
src/content/demo/phase5DemoSequence.ts
src/style.css
package.json
```

Keep `Game.ts` limited to construction, dependency wiring, boot, loop, and lifecycle.
Do not move checkpoint branches, Phone snapshot assembly, or storage parsing into it.

## 14. Completion criteria

### Storage and validation

- Uses `ur-game:save:v1` and schema version `1`.
- Game Save contains only version and checkpoint ID.
- Malformed JSON, unavailable storage, and version mismatch do not crash.
- Unknown checkpoint makes Continue unavailable.
- Duplicate checkpoint IDs and unknown Scene/Phone references fail content startup
  validation.
- Save failure does not stop gameplay.

### New Game, Continue, and Reset

- Startup shows New Game before any sequence begins.
- Continue is unavailable without a valid Save and available with one.
- New Game clears prior Game/Phone progress and starts at the initial checkpoint.
- Continue loads the correct scene and checkpoint Phone state.
- Reset clears both semantic progress stores and refreshes the menu.
- Menu visibility locks movement, Interaction, NPC talk, and Phone access.

### Restore semantics

- Player visual and Rapier character return to the scene spawn.
- Carry is empty, items and PlacePoints come from a fresh scene runtime.
- Task, timer, dialogue line, EventRunner index, wait, and transient UI do not resume.
- A resume sequence starts at index zero.
- No old scene runtime, collider, NPC, task binding, or interaction registration
  survives a cross-scene Continue.

### Architecture and regression

- `SceneManager` does not know checkpoints or SaveData.
- `PhysicsWorld` does not know persistence.
- `PhoneProgress` does not know scenes.
- `EventRunner` does not know `GameSaveStore` or localStorage.
- No Chapter or full-world snapshot is introduced.
- Phase 0-5 movement, collision, camera, Interaction, Carry, task/retry, EventRunner,
  Phone, and scene transition behavior remains intact.
- `npm run build` succeeds.
- `git diff --check` succeeds.

## 15. Manual browser tests

Run at minimum:

1. Clear both storage keys, reload, verify New Game works and Continue is disabled.
2. Start New Game, verify `demo-room` and the initial sequence.
3. Reach checkpoint A, reload, Continue, and verify its scene, Phone state, and
   sequence-from-start behavior.
4. Complete the cross-scene task, save checkpoint B, reload, Continue directly into
   `demo-garden`, and verify no `demo-room` runtime remains.
5. Reload during a task after moving items; verify Continue returns to the previous
   safe checkpoint, not the partial task.
6. Reload while carrying an item; verify the player resumes empty-handed.
7. Reload during dialogue line two; verify that line/event index is not restored.
8. Unlock Phone content after checkpoint A but reload before checkpoint B; verify
   Continue A restores Phone state from A and removes future unlocks.
9. With checkpoint B saved, choose New Game and verify Game Save/Phone unlocks reset
   and play starts in `demo-room`.
10. Put `not-json`, an unsupported version, and an unknown checkpoint ID into the
    Game Save in separate tests; each must leave New Game usable and Continue
    unavailable.
11. While the menu is visible, verify WASD, Interaction, NPC talk, and Phone do not
    operate.
12. Resize the browser and perform a short Phase 0-5 regression pass.

## 16. Implementation report

After implementation, report:

- Added and modified files.
- Final `CheckpointDefinition` and `GameSaveDataV1` shapes.
- Storage keys and versions.
- `CheckpointRegistry` validation rules.
- `GameSaveStore` load/save/clear behavior.
- `set_checkpoint` integration and its exact safe-point position.
- `GameProgressController` responsibility and exact restore order.
- How live EventRunner, task, Carry, and physics state are intentionally not saved.
- `PhoneProgress.replace/reset` behavior and Phase 4 v1 compatibility.
- Start Menu, New Game, Continue, and Reset behavior.
- Malformed/unknown/version-mismatch Save behavior.
- The full fictional Phase 6 checkpoint definitions.
- Build, `git diff --check`, automated checks, and manual browser results.
- Remaining constraints relevant to Phase 7.

## 17. Phase 7 note

Do not implement Phase 7 during this phase. After Checkpoint Resume is proven, most
engine foundations will exist:

```text
movement -> interaction/carry -> NPC/dialogue/task -> EventRunner
  -> Phone progress -> multi-scene -> checkpoint resume
```

The likely next step is a polished fictional vertical slice rather than another
large abstraction layer, but decide that only after reviewing the completed Phase 6.
Continue to assume that any data included in a public web build is retrievable; real
private relationship content must not be committed to this public repository.
