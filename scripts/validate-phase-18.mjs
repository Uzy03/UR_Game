import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Group, Vector3 } from 'three';
import { createServer } from 'vite';

await import('./validate-phase-17.mjs');

const server = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true, hmr: false },
});

const approximatelyEqual = (actual, expected, tolerance = 1e-9) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`,
  );
};

class TestInput {
  movement = { x: 0, y: 0 };
  actionPresses = new Set();

  getMovement() {
    return this.movement;
  }

  press(action) {
    this.actionPresses.add(action);
  }

  consumeActionPress(action) {
    if (!this.actionPresses.has(action)) return false;
    this.actionPresses.delete(action);
    return true;
  }
}

function dispatchKeyboardCode(target, type, code) {
  const event = new Event(type, { cancelable: true });
  Object.defineProperty(event, 'code', { value: code });
  target.dispatchEvent(event);
  return event;
}

try {
  const loadModule = (path) => server.ssrLoadModule(path);
  const { InputAction, INPUT_ACTIONS } = await loadModule('/src/input/InputAction.ts');
  const { KeyboardInput } = await loadModule('/src/input/KeyboardInput.ts');
  const { DashState } = await loadModule('/src/player/DashState.ts');
  const { resolvePlanarActionDirection } = await loadModule(
    '/src/player/PlanarActionDirection.ts',
  );
  const { PlayerController } = await loadModule('/src/player/PlayerController.ts');
  const { CarrySystem } = await loadModule('/src/interaction/CarrySystem.ts');
  const { PickableItem } = await loadModule('/src/interaction/PickableItem.ts');
  const { PlacePoint } = await loadModule('/src/interaction/PlacePoint.ts');
  const { ItemThrowSystem, findFarthestValidLandingPosition } = await loadModule(
    '/src/interaction/ItemThrowSystem.ts',
  );
  const { Stage } = await loadModule('/src/stage/Stage.ts');
  const { GAME_CONFIG } = await loadModule('/src/config/gameConfig.ts');

  assert.ok(INPUT_ACTIONS.includes(InputAction.Dash));
  assert.ok(INPUT_ACTIONS.includes(InputAction.Throw));

  const keyboardTarget = new EventTarget();
  const keyboard = new KeyboardInput(keyboardTarget);
  const dashDown = dispatchKeyboardCode(keyboardTarget, 'keydown', 'Space');
  assert.equal(dashDown.defaultPrevented, true);
  keyboard.update();
  assert.equal(keyboard.wasActionPressed(InputAction.Dash), true);
  assert.equal(keyboard.wasActionPressed(InputAction.Interact), false);
  assert.equal(keyboard.isActionPressed(InputAction.Dash), true);
  keyboard.update();
  assert.equal(keyboard.wasActionPressed(InputAction.Dash), false);
  dispatchKeyboardCode(keyboardTarget, 'keyup', 'Space');

  dispatchKeyboardCode(keyboardTarget, 'keydown', 'KeyE');
  keyboard.update();
  assert.equal(keyboard.wasActionPressed(InputAction.Interact), true);
  assert.equal(keyboard.wasActionPressed(InputAction.Dash), false);
  dispatchKeyboardCode(keyboardTarget, 'keyup', 'KeyE');

  for (const code of ['ShiftLeft', 'ShiftRight']) {
    const shiftDown = dispatchKeyboardCode(keyboardTarget, 'keydown', code);
    assert.equal(shiftDown.defaultPrevented, false);
    keyboard.update();
    assert.equal(keyboard.wasActionPressed(InputAction.Dash), false);
  }
  dispatchKeyboardCode(keyboardTarget, 'keydown', 'KeyQ');
  keyboard.update();
  assert.equal(keyboard.wasActionPressed(InputAction.Throw), true);
  keyboard.update();
  assert.equal(keyboard.wasActionPressed(InputAction.Throw), false);
  dispatchKeyboardCode(keyboardTarget, 'keyup', 'KeyQ');
  keyboard.dispose();

  const diagonal = resolvePlanarActionDirection({ x: 1, z: 1 }, 0, 0.1);
  approximatelyEqual(Math.hypot(diagonal.x, diagonal.z), 1);
  const facingFallback = resolvePlanarActionDirection({ x: 0, z: 0 }, Math.PI / 2, 0.1);
  approximatelyEqual(facingFallback.x, 1);
  approximatelyEqual(facingFallback.z, 0);

  assert.deepEqual(GAME_CONFIG.player.dash, {
    durationSeconds: 0.18,
    speed: 8.8,
    cooldownSeconds: 0.42,
    inputDirectionThreshold: 0.1,
  });
  assert.deepEqual(GAME_CONFIG.itemThrow, {
    distance: 3.6,
    durationSeconds: 0.42,
    arcHeight: 1.25,
    minimumLandingDistance: 0.8,
    landingSearchStep: 0.2,
    inputDirectionThreshold: 0.1,
  });
  assert.deepEqual(
    {
      speed: GAME_CONFIG.player.speed,
      acceleration: GAME_CONFIG.player.acceleration,
      deceleration: GAME_CONFIG.player.deceleration,
      turnSharpness: GAME_CONFIG.player.turnSharpness,
      maxDeltaSeconds: GAME_CONFIG.loop.maxDeltaSeconds,
    },
    {
      speed: 4.4,
      acceleration: 20,
      deceleration: 26,
      turnSharpness: 16,
      maxDeltaSeconds: 0.1,
    },
  );

  const dashResults = new Map();
  for (const fps of [10, 15, 20, 60]) {
    const dash = new DashState(GAME_CONFIG.player.dash);
    assert.equal(dash.tryStart({ x: 3, z: 4 }), true);
    assert.equal(dash.tryStart({ x: 1, z: 0 }), false);
    let elapsedSeconds = 0;
    let activeSeconds = 0;
    let distance = 0;
    const deltaSeconds = 1 / fps;
    while (!dash.canStart && elapsedSeconds < 2) {
      const step = dash.advance(deltaSeconds);
      activeSeconds += step.activeSeconds;
      distance += step.activeSeconds * step.speed;
      elapsedSeconds += deltaSeconds;
    }
    approximatelyEqual(activeSeconds, GAME_CONFIG.player.dash.durationSeconds);
    approximatelyEqual(
      distance,
      GAME_CONFIG.player.dash.durationSeconds * GAME_CONFIG.player.dash.speed,
    );
    assert.ok(elapsedSeconds >= GAME_CONFIG.player.dash.cooldownSeconds);
    assert.ok(elapsedSeconds <= GAME_CONFIG.player.dash.cooldownSeconds + deltaSeconds);
    dashResults.set(fps, { activeSeconds, distance });
    assert.equal(dash.tryStart({ x: 1, z: 0 }), true);
    dash.reset();
    assert.equal(dash.isActive, false);
    assert.equal(dash.canStart, true);
  }
  for (const result of dashResults.values()) {
    approximatelyEqual(result.activeSeconds, 0.18);
    approximatelyEqual(result.distance, 1.584);
  }

  class TestCharacter {
    position = new Vector3(0, 0.9, 0);
    moves = [];

    copyPositionTo(target) {
      target.copy(this.position);
    }

    move(displacement) {
      this.moves.push({ ...displacement });
      this.position.add(new Vector3(displacement.x, displacement.y, displacement.z));
    }

    resetPosition(position) {
      this.position.copy(position);
    }
  }

  const playerInput = new TestInput();
  const character = new TestCharacter();
  const player = new PlayerController(playerInput, character, {
    speed: GAME_CONFIG.player.speed,
    acceleration: GAME_CONFIG.player.acceleration,
    deceleration: GAME_CONFIG.player.deceleration,
    turnSharpness: GAME_CONFIG.player.turnSharpness,
    groundProbeSpeed: GAME_CONFIG.physics.groundProbeSpeed,
    dash: GAME_CONFIG.player.dash,
  });
  playerInput.movement = { x: 1, y: 0 };
  playerInput.press(InputAction.Dash);
  player.updateBeforePhysics(0.1);
  assert.equal(player.isDashing, true);
  approximatelyEqual(character.moves.at(-1).x, 0.88);
  approximatelyEqual(character.moves.at(-1).z, 0);
  player.setCarrying(true);
  assert.equal(player.isDashing, true);
  player.setMovementEnabled(false);
  assert.equal(player.isDashing, false);
  playerInput.press(InputAction.Dash);
  player.updateBeforePhysics(0.1);
  assert.equal(player.isDashing, false);
  approximatelyEqual(character.moves.at(-1).x, 0);
  approximatelyEqual(character.moves.at(-1).z, 0);
  player.setMovementEnabled(true);
  player.reset({ x: 0, y: 0.9, z: 0 }, 0);
  player.triggerThrow();
  for (const fps of [10, 15, 20, 60]) {
    player.updateAfterPhysics(1 / fps);
    player.object.traverse((object) => {
      for (const value of [
        object.position.x,
        object.position.y,
        object.position.z,
        object.rotation.x,
        object.rotation.y,
        object.rotation.z,
        object.scale.x,
        object.scale.y,
        object.scale.z,
      ]) {
        assert.equal(Number.isFinite(value), true);
      }
    });
  }
  player.dispose();

  const farthest = findFarthestValidLandingPosition(
    { x: 0, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { maximumDistance: 3.6, minimumDistance: 0.8, step: 0.2 },
    ({ x }) => x <= 2.01,
  );
  assert.ok(farthest !== null);
  approximatelyEqual(farthest.x, 2);

  const throwOptions = {
    ...GAME_CONFIG.itemThrow,
    landingSpacing: GAME_CONFIG.interaction.floorItemSpacing,
  };

  function createThrowFixture(itemCount = 1, validator = () => true) {
    const scene = new Group();
    const worldRoot = new Group();
    const playerObject = new Group();
    const carryAnchor = new Group();
    scene.add(worldRoot, playerObject);
    playerObject.add(carryAnchor);
    carryAnchor.position.set(0, 1.2, 0.45);
    const items = Array.from({ length: itemCount }, (_, index) => new PickableItem({
      id: `throw-item-${index}`,
      kind: index % 2 === 0 ? 'tomato' : 'box',
      position: { x: -2 + index, y: 0, z: -2 },
      parent: worldRoot,
    }));
    const input = new TestInput();
    const throwPlayer = {
      object: playerObject,
      isMovementEnabled: true,
      throwFeedbackCount: 0,
      triggerThrow() {
        this.throwFeedbackCount += 1;
      },
    };
    const carry = new CarrySystem(carryAnchor);
    carry.bindScene(worldRoot, items, validator);
    const itemThrow = new ItemThrowSystem(input, throwPlayer, carry, throwOptions);
    itemThrow.bindScene(worldRoot, items, validator);
    return { scene, worldRoot, playerObject, carryAnchor, items, input, throwPlayer, carry, itemThrow };
  }

  function startThrow(fixture, item, movement = { x: 1, y: 0 }) {
    assert.equal(fixture.carry.pickUp(item), true);
    fixture.input.movement = movement;
    fixture.input.press(InputAction.Throw);
    fixture.itemThrow.update(0);
  }

  for (const fps of [10, 15, 20, 60]) {
    const fixture = createThrowFixture();
    const item = fixture.items[0];
    item.markProcessed();
    startThrow(fixture, item);
    assert.equal(fixture.carry.hasItem, false);
    assert.equal(item.isThrown, true);
    assert.equal(item.isOnFloor(), false);
    assert.equal(item.canBePickedUp, false);
    assert.equal(item.canInteract({ carry: fixture.carry }), false);
    assert.equal(fixture.throwPlayer.throwFeedbackCount, 1);
    assert.throws(() => item.captureRuntimeState(), /cannot be captured while airborne/);

    fixture.itemThrow.update(GAME_CONFIG.itemThrow.durationSeconds / 2);
    assert.ok(item.object.position.y > 1.2);

    let elapsedSeconds = GAME_CONFIG.itemThrow.durationSeconds / 2;
    const deltaSeconds = 1 / fps;
    while (fixture.itemThrow.activeThrowCount > 0 && elapsedSeconds < 2) {
      fixture.itemThrow.update(deltaSeconds);
      elapsedSeconds += deltaSeconds;
    }
    assert.equal(fixture.itemThrow.activeThrowCount, 0);
    assert.equal(item.isOnFloor(), true);
    assert.equal(item.canBePickedUp, true);
    assert.equal(item.isProcessed, true);
    approximatelyEqual(item.object.position.x, GAME_CONFIG.itemThrow.distance);
    approximatelyEqual(item.object.position.y, 0);
    approximatelyEqual(item.object.position.z, 0);
    assert.equal(item.object.parent, fixture.worldRoot);
    fixture.itemThrow.dispose();
  }

  const invalidFixture = createThrowFixture(1, () => false);
  startThrow(invalidFixture, invalidFixture.items[0]);
  assert.equal(invalidFixture.itemThrow.activeThrowCount, 0);
  assert.equal(invalidFixture.carry.item, invalidFixture.items[0]);
  assert.equal(invalidFixture.items[0].isThrown, false);
  assert.equal(invalidFixture.throwPlayer.throwFeedbackCount, 0);
  invalidFixture.itemThrow.dispose();

  const multiFixture = createThrowFixture(2);
  startThrow(multiFixture, multiFixture.items[0]);
  startThrow(multiFixture, multiFixture.items[1]);
  assert.equal(multiFixture.itemThrow.activeThrowCount, 2);
  multiFixture.itemThrow.update(GAME_CONFIG.itemThrow.durationSeconds);
  const landingDistance = multiFixture.items[0].object.position.distanceTo(
    multiFixture.items[1].object.position,
  );
  assert.ok(
    landingDistance >= (
      multiFixture.items[0].footprintRadius
      + multiFixture.items[1].footprintRadius
      + GAME_CONFIG.interaction.floorItemSpacing
    ),
  );
  const placePoint = new PlacePoint({
    id: 'no-auto-catch',
    position: multiFixture.items[0].object.position,
    parent: multiFixture.worldRoot,
  });
  assert.equal(placePoint.isOccupied, false);
  assert.equal(multiFixture.items[0].object.parent, multiFixture.worldRoot);

  assert.equal(multiFixture.carry.pickUp(multiFixture.items[0]), true);
  multiFixture.input.press(InputAction.Throw);
  multiFixture.itemThrow.update(0);
  assert.equal(multiFixture.itemThrow.activeThrowCount, 1);
  multiFixture.itemThrow.cancelAll();
  assert.equal(multiFixture.itemThrow.activeThrowCount, 0);
  const cancelledLanding = multiFixture.items[0].object.position.clone();
  multiFixture.itemThrow.update(1);
  assert.deepEqual(multiFixture.items[0].object.position.toArray(), cancelledLanding.toArray());
  assert.equal(multiFixture.items[0].isOnFloor(), true);

  assert.equal(multiFixture.carry.pickUp(multiFixture.items[0]), true);
  multiFixture.input.press(InputAction.Throw);
  multiFixture.itemThrow.update(0);
  const replacementRoot = new Group();
  multiFixture.itemThrow.bindScene(replacementRoot, [], () => true);
  assert.equal(multiFixture.itemThrow.activeThrowCount, 0);
  assert.equal(multiFixture.items[0].isOnFloor(), true);
  multiFixture.itemThrow.dispose();

  const physics = { createFixedBox: () => ({ dispose: () => undefined }) };
  const stageRoot = new Group();
  const stage = new Stage(stageRoot, physics, {
    width: 8,
    depth: 8,
    floorThickness: 0.4,
    wallThickness: 0.5,
    wallHeight: 1.5,
    floorColor: 0xffffff,
    wallColor: 0xffffff,
    obstacles: [{
      kind: 'table',
      position: { x: 3, y: 0.5, z: 0 },
      size: { x: 1.5, y: 1, z: 1 },
      color: 0xffffff,
    }],
    items: [{ id: 'stage-throw-item', kind: 'tomato', position: { x: -3, y: 0, z: -3 } }],
    placePoints: [],
  });
  const stageItem = stage.pickableItems[0];
  const stageLanding = findFarthestValidLandingPosition(
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { maximumDistance: 3.6, minimumDistance: 0.8, step: 0.2 },
    (position) => stage.isFloorDropPositionValid(
      position,
      stageItem,
      stage.pickableItems,
      GAME_CONFIG.interaction.floorItemSpacing,
    ),
  );
  assert.ok(stageLanding !== null);
  approximatelyEqual(stageLanding.x, 2);
  assert.equal(
    stage.isFloorDropPositionValid(
      { x: 4, z: 0 },
      stageItem,
      stage.pickableItems,
      GAME_CONFIG.interaction.floorItemSpacing,
    ),
    false,
  );
  stage.dispose();

  for (const path of [
    'src/events/PlacementTaskEventBinding.ts',
    'src/events/ProcessingTaskEventBinding.ts',
    'src/events/AssemblyTaskEventBinding.ts',
  ]) {
    const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
    const cancelIndex = source.indexOf('itemThrow.cancelAll()');
    const restoreIndex = source.indexOf('restoreRuntimeState');
    assert.ok(cancelIndex >= 0, `${path} does not cancel airborne throws`);
    assert.ok(restoreIndex < 0 || cancelIndex < restoreIndex, `${path} restores before throw cleanup`);
  }

  const sceneManagerSource = await readFile(
    new URL('../src/scene/SceneManager.ts', import.meta.url),
    'utf8',
  );
  assert.match(sceneManagerSource, /itemThrow\.unbindScene\(\)/);
  assert.match(sceneManagerSource, /stage\.isFloorDropPositionValid/);

  const runtimeHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(runtimeHtml, /Anniversary Game — Phase 18/);
  assert.match(runtimeHtml, /Phase 18 Dash &amp; Throw/);
  assert.match(runtimeHtml, /<kbd>Space<\/kbd> Dash/);
  assert.match(runtimeHtml, /<kbd>E<\/kbd> Interact/);
  assert.match(runtimeHtml, /<kbd>Q<\/kbd> Throw/);
  assert.doesNotMatch(runtimeHtml, /E \/ Space/);
  assert.doesNotMatch(runtimeHtml, /<kbd>Shift/);

  const interactionPromptSource = await readFile(
    new URL('../src/ui/InteractionPrompt.ts', import.meta.url),
    'utf8',
  );
  assert.match(interactionPromptSource, /`E : \$\{label\}`/);

  console.log('Phase 18 browser-free validation passed.');
} finally {
  await server.close();
}
