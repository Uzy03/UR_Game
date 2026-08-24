# UR_Game Phase 5 Specification

## Review baseline

- Repository: `Uzy03/UR_Game`
- Phase 4 branch: `feature/phase-4-smartphone`
- Phase 4 commit: `a5a674b8c266f0f56e4fbb511c8f76dc63bf4e7c`
- Recommended Phase 5 branch: `feature/phase-5-multi-scene`

The Phase 4 review found no blocking issue. The Phone controller, progress model,
storage, content registry, UI, EventRunner integration, and input locking have
appropriate responsibility boundaries. Phase 5 may proceed from the baseline above.

One non-blocking Phase 4 verification remains: manually inject malformed JSON into
`ur-game:phone-progress:v1`, reload, and confirm that the game starts with safe
defaults. The implementation already contains exception and schema fallbacks, but
the browser path should be exercised during Phase 5 regression testing.

## 1. Goal

Implement a synchronous multi-scene runtime that can safely replace one small 3D
diorama with another:

```text
Scene A
  -> change_scene event
  -> Scene B
```

A scene transition must remove the previous scene's Three.js objects, Rapier bodies,
items, place points, NPCs, task bindings, and interaction registrations; bind the
global gameplay systems to the new scene; and reset the player to the new spawn.

Phase 5 establishes a stable `sceneId` and scene lifecycle. It does not implement
story progress persistence.

## 2. Scope

Implement only:

- Static scene and stage definitions.
- A validated scene content registry.
- Scene-scoped runtime construction and cleanup.
- A synchronous `SceneManager` that loads and replaces scenes.
- Scene-owned Rapier handle cleanup.
- Rebinding of Carry and Interaction systems.
- Mutable current-scene NPC and task registries.
- A single `change_scene` EventRunner event.
- Two fictional demo scenes and one transition sequence.
- Regression tests and manual browser verification for Phase 0 through Phase 4.

Do not implement:

- Chapter, checkpoint, game save/load, save slots, autosave, or Continue UI.
- Persistence of scene ID, player/NPC/item positions, task state, or EventRunner index.
- Async loading, asset streaming, preload management, or a loading screen.
- Fade UI, cinematic cameras, scene transition animation, or a camera event.
- New input actions or a scene-switch debug key in production.
- A generic trigger framework, branching/conditional story, or chapter select.
- New task types, recipes, cooking, score, navigation, pathfinding, or NavMesh.
- New Phone apps or a Phone pause/resume system.
- Real 3D assets, real places, personal messages, or personal photos.

Scene changes may be visually instantaneous. Correct ownership and cleanup take
priority over presentation.

## 3. Responsibility boundaries

### Global systems

Keep these alive across scene changes:

- `Game`
- renderer and Three.js world scene
- `PhysicsWorld`
- player and `KinematicCharacter`
- `InputManager` and `KeyboardInput`
- `PlayerController`
- `FollowCamera`
- `CarrySystem`
- `InteractionSystem`
- `EventRunner`
- Dialogue, speech, task/result, and Phone UI controllers
- `PhoneProgress`, `PhoneProgressStore`, and `PhoneContentRegistry`

### Scene-scoped systems

Create and dispose these per scene:

- `Stage`
- stage root, geometry, and materials
- stage fixed Rapier bodies/colliders
- `PickableItem` and `PlacePoint` instances
- NPC instances
- placement task instances and task bindings
- demo interaction handlers owned by the scene runtime

### Key rules

- `SceneManager` owns scene-runtime creation, replacement, and disposal only. It does
  not decide story order or operate Phone progress.
- `EventRunner` requests a scene through a minimal `SceneActions` interface. It does
  not know Three.js, Rapier, `Stage`, `CarrySystem`, or `SceneRuntime`.
- `Stage` builds the physical diorama but does not know events, NPC dialogue, tasks,
  or story order.
- `PhysicsWorld` manages Rapier resources but knows nothing about scene content.
- `CarrySystem` and `InteractionSystem` remain global and know only the currently
  bound scene objects, not scene IDs.
- Input locking during an event sequence remains the responsibility of
  `EventRunner`; `SceneManager` must not introduce a competing input-lock owner.
- `Game.ts` composes systems and runs the loop. Scene content and scene-specific
  object creation must not be embedded in it.

## 4. Data model

Add `src/scene/SceneTypes.ts` and move only the stage-specific types needed for
reusable scene data into `src/stage/StageTypes.ts`.

Conceptual types:

```ts
export interface Vector3Config {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface SceneDefinition {
  readonly id: string;
  readonly playerSpawn: {
    readonly position: Vector3Config;
    readonly facing: number;
  };
  readonly stage: StageDefinition;
  readonly npcs: readonly SceneNpcDefinition[];
  readonly placementTasks: readonly ScenePlacementTaskDefinition[];
}

export interface SceneNpcDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly position: Vector3Config;
  readonly moveSpeed: number;
  readonly turnSharpness: number;
}

export interface ScenePlacementTaskDefinition {
  readonly id: string;
  readonly label: string;
  readonly durationSeconds: number;
  readonly requiredItemIds: readonly string[];
  readonly targetPlacePointIds: readonly string[];
  readonly attemptPlayerPosition: Vector3Config;
  readonly attemptPlayerFacing: number;
}
```

`StageDefinition` should contain the existing stage dimensions, obstacles, items,
and place points without depending on all of `GAME_CONFIG`:

```ts
export interface StageDefinition {
  readonly width: number;
  readonly depth: number;
  readonly floorThickness: number;
  readonly wallThickness: number;
  readonly wallHeight: number;
  readonly obstacles: readonly StageObstacleDefinition[];
  readonly items: readonly StagePickableItemDefinition[];
  readonly placePoints: readonly StagePlacePointDefinition[];
}
```

Reuse the existing item, place-point, obstacle, and visual config shapes where they
already fit. Do not reorganize unrelated configuration.

IDs for NPCs and tasks need only be unique within a scene. Reusing the same NPC ID in
two scenes is allowed because the current-scene registry is replaced on transition.

## 5. SceneContentRegistry

Add `src/scene/SceneContentRegistry.ts`.

Responsibilities:

- Register immutable `SceneDefinition` data.
- Resolve a scene by ID using
  `getScene(sceneId: string): SceneDefinition | undefined`.
- Validate all definitions at construction time and fail loudly.

Validate at minimum:

- Non-empty, globally unique scene IDs.
- Finite player spawn coordinates and facing.
- Finite positive stage width, depth, wall/floor thickness, and wall height.
- Finite obstacle, item, and place-point coordinates and sizes.
- Unique item and place-point IDs within a scene.
- Unique NPC IDs within a scene.
- Finite NPC position; finite non-negative speed and turn sharpness.
- Unique placement task IDs within a scene.
- Finite non-negative task duration.
- Finite task attempt spawn coordinates and facing.
- Every task item ID resolves to an item in the same scene.
- Every task target ID resolves to a place point in the same scene.

Use explicit errors containing the scene ID and invalid field. Do not silently skip
invalid data and do not use `any` in validation.

## 6. SceneRuntime

Add `src/scene/SceneRuntime.ts` as either a small class or an internal interface plus
factory. Its shape should be approximately:

```ts
export interface SceneRuntime {
  readonly definition: SceneDefinition;
  readonly root: THREE.Group;
  readonly stage: Stage;
  readonly npcs: readonly NPCController[];
  readonly taskBindings: readonly TaskEventBinding[];
  dispose(): void;
}
```

The definition is immutable data; the runtime contains live Three.js and gameplay
objects. The runtime owns every scene-scoped listener and object it creates.

Its `dispose()` must be idempotent and release:

- Scene-specific interaction handlers.
- NPC resources and handlers.
- Task bindings/listeners.
- `Stage` resources.
- The scene root from its parent.
- Scene-owned geometry and materials exactly once.

Avoid double-disposing an item/NPC resource from both `Stage` and `SceneRuntime`.
Define one clear owner for each object.

## 7. Physics resource ownership

Extend `PhysicsWorld` so fixed bodies created for a stage can be removed without
recreating the whole physics world. Keep Rapier types encapsulated.

Conceptual API:

```ts
export interface PhysicsBodyHandle {
  dispose(): void;
}

createFixedBox(/* existing arguments */): PhysicsBodyHandle;
```

The handle owns the created rigid body/collider reference and removes it from the
Rapier world on `dispose()`. Disposal must be safe if called once by the documented
owner; making it idempotent is preferred.

`Stage` must retain all handles that it creates. Add `Stage.dispose()` to:

- Dispose every stage-owned physics handle.
- Detach its root from its parent.
- Dispose its primitive geometries and materials.

After A -> B -> A -> B, the Rapier body count must not grow with each transition and
no invisible collider from a previous scene may remain.

The player's kinematic body/controller remains global and must not be disposed with a
scene.

## 8. Global system rebinding

### CarrySystem

Keep `CarrySystem` player-owned and global. Replace constructor-fixed scene data with
an explicit binding lifecycle equivalent to:

```ts
bindScene(
  worldRoot: THREE.Object3D,
  allItems: readonly PickableItem[],
  floorDropValidator: FloorDropValidator,
): void;

unbindScene(): void;
```

Before unbinding, reset any carried item so an old-scene item cannot stay under the
carry anchor or move into the new scene. `CarrySystem` must not know the scene ID or
`SceneManager`.

### InteractionSystem

Keep `InteractionSystem` global. Add `clearInteractables(): void` that:

- Clears the current target.
- Removes its highlight.
- Hides the interaction prompt.
- Clears all registered interactables.

It must not change the system's existing enabled/disabled state. After the new scene
is installed, register only its items, place points, and NPCs.

### Current-scene registries

Maintain a single instance of each mutable map:

```ts
Map<string, NPCController>
Map<string, TaskEventBinding>
```

Pass them to `EventRunner` as read-only maps, then mutate them in place on scene
change (`clear()` followed by new entries). Do not recreate `EventRunner` per scene.

### NPC and UI cleanup

Add an idempotent `NPCController.dispose()` if required. It must unregister handlers,
detach its object, and dispose owned geometry/material without knowing SceneManager.

Call `speechBubble.hide()` before disposing a runtime so no UI controller retains an
old NPC target. Hide/reset any scene-scoped task or result presentation as part of
the scene transition boundary.

## 9. SceneManager

Add `src/scene/SceneManager.ts` with a minimal synchronous API:

```ts
export interface SceneActions {
  loadScene(sceneId: string): void;
}

export class SceneManager implements SceneActions {
  get currentSceneId(): string | null;
  loadScene(sceneId: string): void;
  dispose(): void;
}
```

A private re-entrancy guard is sufficient. Do not introduce an asynchronous loading
state machine. A repeated `loadScene` while the synchronous transition is already in
progress must throw a clear error.

Dependencies should be limited to what runtime construction and rebinding need:

- Three.js world scene.
- `PhysicsWorld`.
- Player controller/kinematic reset capability.
- `CarrySystem` and `InteractionSystem`.
- Shared NPC and task maps.
- Existing result/speech UI cleanup hooks.
- `SceneContentRegistry` and a scene runtime factory.

Do not pass Phone progress/controller to SceneManager.

### Load order

Implement the transition approximately as follows:

1. Resolve the target definition; throw for an unknown ID.
2. Build a detached candidate runtime from the already validated definition.
3. If candidate creation fails, dispose the partial candidate and keep the current
   scene intact.
4. Once creation succeeds, clear current interaction target/registrations.
5. Reset carried state and unbind Carry.
6. Hide speech/task-result UI that may reference the old runtime.
7. Dispose the current runtime and clear the shared NPC/task maps.
8. Attach the candidate root to the world.
9. Bind Carry to the candidate stage.
10. Register candidate items, place points, and NPCs with Interaction.
11. Populate the shared NPC and task maps.
12. Reset both the visual player and Rapier kinematic character to the candidate
    spawn position and facing.
13. Publish `currentSceneId` and the candidate as current.

Candidate and current scene physics bodies may coexist only during this single
synchronous call; no physics step may run between construction and swap.

Validate as much as possible before destroying the old runtime. If an unexpected
error occurs after the old runtime is disposed, clean the candidate and throw; never
leave a half-registered candidate or repeat the error every frame.

`SceneManager.dispose()` must clear Interaction, reset/unbind Carry, hide old-target
UI, clear both shared registries, dispose the current runtime, and set current scene
to null. It must not erase Phone progress.

## 10. EventRunner integration

Add exactly one event type:

```ts
export interface ChangeSceneEvent {
  readonly type: 'change_scene';
  readonly sceneId: string;
}
```

Add it to `GameEvent`. Inject only `SceneActions` into `EventRunner`.

For `change_scene`:

1. Existing EventRunner sequence locking remains active.
2. Call `sceneActions.loadScene(sceneId)` synchronously.
3. On success, ensure NPCs created in the new scene are interaction-disabled while
   the sequence is still running.
4. Complete the event immediately and advance on the normal EventRunner path.
5. On an unknown scene or load exception, enter the existing EventRunner `error`
   state and fill the existing `lastError` fields (`sequenceId`, `eventIndex`,
   `eventType`, and message).

No Promise, loading screen, polling, or new per-frame transition state is required.

### NPC locking across replacement

The sequence may replace the NPC instances while EventRunner holds gameplay locks.
Refactor the existing NPC lock helper minimally so it can be called at sequence start
and again immediately after a successful scene change:

```ts
for (const npc of currentNpcRegistry.values()) {
  if (!savedNpcInteractionStates.has(npc)) {
    savedNpcInteractionStates.set(npc, npc.isInteractionEnabled);
  }
  npc.setInteractionEnabled(false);
}
```

On complete, cancel, or error, restore only live current-scene instances. Check that
the shared map still resolves the same instance before restoring; never resurrect or
operate on a disposed old-scene NPC.

Only the serialized order `task -> task complete -> change_scene` is supported. Do
not add a way to force scene replacement in the middle of an active task.

## 11. Player, camera, input, and Phone

- Add or reuse one player reset operation that updates both the Three.js transform
  and Rapier kinematic position, plus facing. Updating only the visual is invalid.
- Keep `FollowCamera` global. It should naturally follow the reset player; no camera
  cut or animation is needed.
- Add no new `InputAction` and no direct key check. Scene changes originate only from
  the EventRunner event in production.
- EventRunner's existing running-state lock keeps movement and Interaction disabled
  throughout `change_scene`.
- The Phone remains unavailable while EventRunner is running and becomes available
  again after the sequence ends.
- SceneManager must not force input back on; EventRunner restores the exact saved
  input/interaction state on complete, cancel, or error.

## 12. PhoneProgress compatibility

Keep the existing storage key and snapshot version unchanged:

```text
ur-game:phone-progress:v1
```

Do not add scene ID, player position, chapter, or checkpoint to Phone progress. A
scene change must preserve story date, current objective, unlocked message IDs, and
unlocked photo IDs.

Keep the existing fictional `demo-message-1` and `demo-photo-1` registry entries so
Phase 4 storage does not lose them as unknown IDs. Phase 5 performs no migration and
does not define a future unified `SaveData` type.

Reloading the browser may return to the initial scene. This is intentional in Phase
5.

## 13. Demo content

Add fictional content under `src/content/demo/`, for example:

- `phase5Scenes.ts`
- `phase5DemoSequence.ts`

### Scene A: `demo-room`

- Small stage with a distinct layout.
- A fictional Helper NPC.
- A few obstacles and enough Phase 1 objects to regression-test Pick/Carry/Place.
- The Helper NPC starts the Phase 5 demo sequence.

### Scene B: `demo-garden`

- Clearly different floor dimensions, colors, and obstacle layout.
- A fictional Helper NPC (the same NPC ID may be reused).
- About three pickable items and three place points.
- One existing `PlacementTask` definition.

Do not use real place names or personal content.

### Demo sequence

Use the existing event types plus `change_scene`:

```text
Scene A Helper Talk
-> dialogue
-> set_date
-> set_objective
-> unlock_message
-> change_scene(demo-garden)
-> dialogue
-> move_npc
-> speech
-> wait
-> task
-> unlock_photo
-> set_objective(null)
-> outro dialogue
-> sequence complete
```

After the transition, `move_npc` and `task` must resolve through the new Scene B
registries. No old Scene A instance may be returned.

Do not create a generic trigger framework. One small demo-specific NPC binding is
enough and may live next to the demo content rather than in `Game.ts`.

For repeated cleanup verification, a temporary development-only API may switch
A -> B -> A -> B. Remove it before the final commit; do not add a production debug
UI or key binding.

## 14. Game composition and files

Expected additions or focused changes:

```text
src/
  scene/
    SceneTypes.ts
    SceneContentRegistry.ts
    SceneRuntime.ts
    SceneManager.ts
  stage/
    Stage.ts
    StageTypes.ts
  physics/
    PhysicsWorld.ts
  interaction/
    InteractionSystem.ts
    CarrySystem.ts
  npc/
    NPCController.ts
  events/
    EventTypes.ts
    EventRunner.ts
  content/demo/
    phase5Scenes.ts
    phase5DemoSequence.ts
  core/
    Game.ts
```

Adapt names to the current repository instead of creating duplicate concepts.

`Game.ts` should read approximately as:

```text
create global systems
-> create shared current-scene maps
-> create SceneContentRegistry
-> create SceneManager
-> create EventRunner with SceneActions and shared maps
-> load initial scene
-> attach minimal demo trigger
-> run existing game loop
```

Do not place per-scene stage/NPC/task/item construction or event content directly in
`Game.ts`, and do not introduce a dependency-injection framework.

## 15. Errors and cleanup guarantees

Treat these as explicit errors:

- Unknown or duplicate scene ID.
- Invalid scene dimensions, coordinates, or spawn.
- Duplicate NPC/item/place-point/task ID in a scene.
- Task reference to an unknown item or place point.
- Candidate runtime construction failure.
- Re-entrant scene load.

Throw `Error` values with useful context. EventRunner converts scene-event failures
to its normal error state. Catch values as `unknown`; do not use `any` merely to read
an error message.

Failure must not leave:

- A partial scene root.
- Candidate Rapier bodies.
- Old Interaction targets/highlights/prompts.
- An old item under the carry anchor.
- Old NPC/task entries in the current maps.
- UI holding a disposed NPC.
- Repeated console output each frame.

No separate SceneManager error UI is required.

## 16. Completion criteria

All of the following must pass:

1. Two scenes can be represented as validated data with stable unique IDs.
2. The initial scene loads at startup.
3. `change_scene` switches to the second scene from an EventRunner sequence.
4. The player is moved visually and physically to the new spawn and facing.
5. WASD and FollowCamera work after the transition.
6. New-scene wall/obstacle collision works.
7. Old-scene Three.js objects do not remain.
8. Old-scene Rapier bodies/colliders do not remain.
9. Repeated A/B switching does not accumulate objects, bodies, NPCs, or items.
10. A carried old-scene item is reset and not transferred to the new scene.
11. Interaction prompt/highlight is cleared, then only new-scene objects are found.
12. Scene B supports Pick, Carry, Place, and floor drop as before.
13. Scene A NPC does not remain; Scene B NPC can be talked to.
14. `move_npc` resolves the Scene B NPC after transition.
15. PlacementTask resolves the Scene B binding and supports timeout/retry/clear.
16. EventRunner keeps new-scene NPC interaction locked until its sequence ends.
17. Unknown scene ID produces the existing EventRunner error rather than a crash or
    silent skip.
18. Phone cannot open while EventRunner is running and works afterward.
19. Phone date/objective/message/photo progress survives scene changes.
20. Existing Phase 4 localStorage remains compatible and retains existing demo IDs.
21. Phase 0-4 movement, physics, interaction, NPC, dialogue, task, retry, result,
    event, and Phone behavior has no regression.
22. No real personal data or secrets are committed.
23. TypeScript has no build errors and `npm run build` succeeds.

## 17. Manual browser tests

Run in Chromium/Chrome, not only through build checks.

### Initial Scene A

1. Confirm the Scene A layout and player spawn/facing.
2. Move with WASD and collide with a wall/obstacle.
3. Pick, carry, place, retrieve, and floor-drop an item.
4. Talk to the Helper NPC.

### A to B sequence

1. Start the demo sequence.
2. Confirm dialogue and Phone progress events before `change_scene`.
3. Confirm Scene B replaces Scene A in the same sequence.
4. Confirm old floor, walls, obstacles, NPC, items, and place points are absent.
5. Confirm the player appears at Scene B's spawn/facing and the camera follows.
6. Confirm movement remains locked until the sequence releases it.

### Invisible collider and registry tests

1. Walk through coordinates occupied only by a Scene A obstacle; no invisible wall
   may block Scene B.
2. Confirm `move_npc` targets Scene B's NPC.
3. Confirm `task` targets Scene B's task binding.
4. Confirm the old NPC cannot be selected or highlighted.

### Scene B regression

1. Test WASD, collision, Pick, Carry, Place, and floor drop.
2. Test NPC Talk, Dialogue, NPC move, Speech, and Wait.
3. Let PlacementTask reach TIME UP, press R to retry, then complete it and reach
   CLEAR.
4. Finish the sequence and confirm normal exploration returns.

### Carry and repeated switch cleanup

1. Trigger a transition while carrying a Scene A item; confirm it is absent from the
   carry anchor and Scene B.
2. During development, switch A -> B -> A -> B at least three times.
3. Confirm there are no duplicate objects, NPCs, items, prompts, or invisible
   colliders and no growing Rapier-body count.
4. Remove the temporary switching hook before commit.

### Phone compatibility

1. Confirm previously unlocked date/message/photo data still exists in Scene A.
2. Transition to Scene B and confirm the same Phone data remains.
3. Press F during the running transition sequence; Phone must not open.
4. After sequence completion, open and close Phone normally.
5. Reload with existing `ur-game:phone-progress:v1`; data must remain compatible.
6. Back up any useful local test data, inject malformed JSON into that key, reload,
   and confirm safe defaults with no crash. Restore/clear the test value afterward.

### Error and console checks

1. Through temporary test code, request an unknown scene and confirm one clear
   EventRunner error with no infinite loop or half-created runtime.
2. Remove that temporary code before commit.
3. Confirm no unexpected console errors/warnings throughout the full flow.

## 18. Implementation report

After implementation, report:

- Branch, commit SHA, and commit message.
- Added/changed files.
- Final `SceneDefinition` and stage data boundary.
- Responsibilities of `SceneContentRegistry`, `SceneRuntime`, and `SceneManager`.
- How the player visual and Rapier body are reset.
- What owns and disposes each Three.js and Rapier resource.
- How NPC/item/place-point registrations are removed.
- How Carry is reset and rebound.
- How the shared NPC/task maps are updated without recreating EventRunner.
- The `change_scene` event and error path.
- How new NPC interaction is kept locked during the continuing sequence.
- Both demo scene definitions and the full demo event sequence.
- Confirmation that Phone storage key/version and existing demo content IDs were
  preserved.
- `npm run build` result.
- Full browser/regression results, including A/B repetition, invisible-collider,
  timeout/retry/clear, malformed-storage, and console checks.
- Confirmation that only fictional data/assets were committed.
- Items intentionally deferred to Phase 6.

## 19. Phase 6 boundary

Once scene IDs and lifecycle are stable, Phase 6 may design checkpoint-based game
progress and Save/Load. For a short linear game, prefer restoring a safe checkpoint
over serializing every live object and partial animation/task state.

A future minimal save might contain:

```text
current scene ID
checkpoint ID
story progress
phone progress
```

Re-evaluate whether a separate Chapter concept is actually needed; `sceneId` plus
`checkpointId` may be sufficient. Do not predefine or persist this structure during
Phase 5.

## 20. Public repository data policy

All committed demo content must remain fictional and generic. Do not commit names,
faces, personal photos, private conversations, addresses, contact information,
credentials, API keys, private URLs/tokens, or real-world location histories.

Do not rely on `.gitignore` after a sensitive file has entered Git history. Keep
personal content outside tracked `src/` and `public/` from the start. Continue using
the existing ignored private/local paths. A private content loader is also outside
Phase 5; do not add one preemptively.
