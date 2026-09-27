import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { Group } from 'three';
import { createServer } from 'vite';

await import('./validate-phase-20.mjs');

const server = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true, hmr: false },
});

const near = (actual, expected) => assert.ok(
  Math.abs(actual - expected) < 1e-6,
  `${actual} != ${expected}`,
);
const source = (path) => readFile(new URL(path, import.meta.url), 'utf8');

try {
  const { InputAction } = await server.ssrLoadModule('/src/input/InputAction.ts');
  const { GamepadInput, radialDeadzone } = await server.ssrLoadModule('/src/input/GamepadInput.ts');
  const { InputManager } = await server.ssrLoadModule('/src/input/InputManager.ts');
  const { WorldMapVehicle } = await server.ssrLoadModule('/src/world/WorldMapVehicle.ts');
  const { PhoneController } = await server.ssrLoadModule('/src/phone/PhoneController.ts');
  const { StartMenu } = await server.ssrLoadModule('/src/ui/StartMenu.ts');
  const { KeyboardInput } = await server.ssrLoadModule('/src/input/KeyboardInput.ts');
  const { CarrySystem } = await server.ssrLoadModule('/src/interaction/CarrySystem.ts');
  const { PickableItem } = await server.ssrLoadModule('/src/interaction/PickableItem.ts');
  const { ProcessingStation } = await server.ssrLoadModule('/src/interaction/ProcessingStation.ts');
  const { AssemblyStation } = await server.ssrLoadModule('/src/interaction/AssemblyStation.ts');
  const { InteractionSystem } = await server.ssrLoadModule('/src/interaction/InteractionSystem.ts');
  const { ItemThrowSystem } = await server.ssrLoadModule('/src/interaction/ItemThrowSystem.ts');
  const { GAME_CONFIG } = await server.ssrLoadModule('/src/config/gameConfig.ts');

  assert.deepEqual(radialDeadzone(0.1, 0.1), { x: 0, y: 0 });
  near(radialDeadzone(0.59, 0).x, 0.5);
  near(Math.hypot(...Object.values(radialDeadzone(1, 1))), 1);
  near(radialDeadzone(1, 0).x, 1);
  assert.deepEqual(radialDeadzone(Number.NaN, Infinity), { x: 0, y: 0 });
  near(radialDeadzone(-Infinity, 0.5).y, (0.5 - 0.18) / 0.82);

  const makePad = (index, mapping = 'standard') => ({
    index,
    mapping,
    connected: true,
    axes: [0, 0],
    buttons: Array.from({ length: 10 }, () => ({ pressed: false })),
  });
  const first = makePad(0);
  const second = makePad(1);
  const wakePad = makePad(0);
  wakePad.buttons[0].pressed = true;
  const wakeInput = new GamepadInput(() => [wakePad]);
  wakeInput.update();
  assert.equal(wakeInput.wasActionPressed(InputAction.Dash), true);
  wakeInput.update();
  assert.equal(wakeInput.wasActionPressed(InputAction.Dash), false);
  let pads = [first, second];
  const gamepad = new GamepadInput(() => pads);
  gamepad.update();
  first.axes = [0.59, 0];
  first.buttons[0].pressed = true;
  first.buttons[1].pressed = true;
  first.buttons[2].pressed = true;
  first.buttons[3].pressed = true;
  first.buttons[9].pressed = true;
  gamepad.update();
  near(gamepad.getMovement().x, 0.5);
  for (const action of [InputAction.Dash, InputAction.Interact, InputAction.Retry, InputAction.Throw, InputAction.Work, InputAction.Phone]) {
    assert.equal(gamepad.isActionPressed(action), true, `${action} held`);
    assert.equal(gamepad.wasActionPressed(action), true, `${action} edge`);
  }
  assert.equal(gamepad.isActionPressed(InputAction.Back), true);
  first.buttons[2].pressed = false;
  gamepad.update();
  for (const action of [InputAction.Dash, InputAction.Interact, InputAction.Retry, InputAction.Throw, InputAction.Work, InputAction.Phone]) {
    assert.equal(gamepad.isActionPressed(action), true);
    assert.equal(gamepad.wasActionPressed(action), false, `${action} must not repeat`);
  }
  first.buttons[2].pressed = true;
  gamepad.update();
  assert.equal(gamepad.wasActionPressed(InputAction.Back), false, 'Square must remain unassigned');
  const squarePad = makePad(0);
  squarePad.buttons[2].pressed = true;
  const squareInput = new GamepadInput(() => [squarePad]);
  squareInput.update();
  for (const action of Object.values(InputAction)) {
    assert.equal(squareInput.isActionPressed(action), false, `Square must not hold ${action}`);
    assert.equal(squareInput.wasActionPressed(action), false, `Square must not trigger ${action}`);
  }
  first.connected = false;
  second.axes = [0.7, 0];
  second.buttons[1].pressed = true;
  gamepad.update();
  assert.equal(gamepad.wasActionPressed(InputAction.Interact), false);
  assert.equal(gamepad.wasActionPressed(InputAction.Retry), false);
  near(gamepad.getMovement().x, (0.7 - 0.18) / 0.82);
  second.buttons[1].pressed = false;
  gamepad.update();
  second.buttons[1].pressed = true;
  gamepad.update();
  assert.equal(gamepad.wasActionPressed(InputAction.Interact), true);
  pads = [null, null];
  gamepad.update();
  assert.deepEqual(gamepad.getMovement(), { x: 0, y: 0 });
  assert.equal(gamepad.isActionPressed(InputAction.Interact), false);
  assert.equal(gamepad.wasActionPressed(InputAction.Interact), false);
  first.connected = true;
  first.axes = [0, 0];
  first.buttons[1].pressed = false;
  pads = [first, second];
  gamepad.update();
  assert.equal(gamepad.wasActionPressed(InputAction.Interact), false);
  assert.deepEqual(gamepad.getMovement(), { x: 0, y: 0 });

  const nonstandard = makePad(0, '');
  const standard = makePad(1);
  pads = [nonstandard, standard];
  const preferred = new GamepadInput(() => pads);
  preferred.update();
  standard.axes = [1, 0];
  preferred.update();
  near(preferred.getMovement().x, 1);
  nonstandard.axes = [-1, 0];
  preferred.update();
  near(preferred.getMovement().x, 1);

  const keyboard = {
    update() {}, dispose() {},
    getMovement: () => ({ x: 0.8, y: 0.8 }),
    isActionPressed: () => false,
    wasActionPressed: () => false,
  };
  const combined = new InputManager([keyboard, preferred]);
  combined.update();
  near(Math.hypot(...Object.values(combined.getMovement())), 1);
  assert.equal(combined.getMovement().x > combined.getMovement().y, true);

  const keyboardTarget = new EventTarget();
  const keyboardInput = new KeyboardInput(keyboardTarget);
  const keyDown = new Event('keydown', { cancelable: true });
  Object.defineProperty(keyDown, 'code', { value: 'KeyE' });
  keyboardTarget.dispatchEvent(keyDown);
  keyboardInput.update();
  assert.equal(keyboardInput.wasActionPressed(InputAction.Interact), true);
  assert.equal(keyboardInput.wasActionPressed(InputAction.Work), true);
  assert.equal(keyboardInput.isActionPressed(InputAction.Work), true);
  keyboardInput.update();
  assert.equal(keyboardInput.wasActionPressed(InputAction.Work), false);
  keyboardInput.dispose();

  function stationFixture(kind) {
    const scene = new Group();
    const world = new Group();
    const playerObject = new Group();
    const anchor = new Group();
    scene.add(world, playerObject);
    playerObject.add(anchor);
    anchor.position.set(0, 1.2, 0.45);
    const itemIds = kind === 'processing' ? ['process-input'] : ['assembly-a', 'assembly-b'];
    const items = itemIds.map((id, index) => new PickableItem({
      id, kind: 'tomato', position: { x: -2 + index, y: 0, z: -2 }, parent: world,
    }));
    const output = kind === 'assembly' ? new PickableItem({
      id: 'assembly-output', kind: 'bundle', position: { x: -3, y: 0, z: -2 },
      parent: world, initialActive: false,
    }) : null;
    const allItems = output === null ? items : [...items, output];
    const carry = new CarrySystem(anchor);
    carry.bindScene(world, allItems, () => true);
    const station = kind === 'processing'
      ? new ProcessingStation({
        id: 'work-input-test', position: { x: 3.3, y: 0, z: 0 },
        processingDurationSeconds: 1.8, acceptedItemIds: itemIds, parent: world,
      })
      : new AssemblyStation({
        id: 'work-input-test', position: { x: 3.3, y: 0, z: 0 },
        combineDurationSeconds: 1.8, inputItems: items, outputItem: output, parent: world,
      });
    if (kind === 'processing') station.setProcessingEnabled(true);
    else station.setAssemblyEnabled(true);
    const pad = makePad(0);
    const input = new InputManager([new GamepadInput(() => [pad])]);
    input.update();
    const player = {
      object: playerObject, isMovementEnabled: true, triggerThrow() {},
    };
    const itemThrow = new ItemThrowSystem(input, player, carry, {
      ...GAME_CONFIG.itemThrow,
      landingSpacing: GAME_CONFIG.interaction.floorItemSpacing,
      assist: {
        endpointRadius: GAME_CONFIG.throwAssist.endpointRadius,
        blendStartProgress: GAME_CONFIG.throwAssist.blendStartProgress,
        minimumForwardDot: GAME_CONFIG.throwAssist.minimumForwardDot,
        maximumLateralOffset: GAME_CONFIG.throwAssist.maximumLateralOffset,
      },
    });
    itemThrow.bindScene(world, allItems, () => true, [station]);
    const labels = [];
    const interaction = new InteractionSystem(
      input, playerObject, carry, [station],
      { setLabel(label, action) { labels.push([label, action]); } },
      GAME_CONFIG.interaction,
    );
    return { items, output, carry, station, pad, input, itemThrow, interaction, playerObject, labels };
  }

  const place = stationFixture('processing');
  assert.equal(place.carry.pickUp(place.items[0]), true);
  place.playerObject.position.x = 2.8;
  place.playerObject.rotation.y = Math.PI / 2;
  assert.equal(place.station.getInteractionAction({ carry: place.carry }), InputAction.Interact);
  place.pad.buttons[1].pressed = true;
  place.input.update();
  place.interaction.update(0);
  assert.equal(place.station.state, 'loaded', 'Circle places an accepted carried item');
  assert.equal(place.station.getInteractionAction({ carry: place.carry }), InputAction.Work);
  assert.deepEqual(place.labels.at(-1), ['Process', InputAction.Work]);
  place.pad.buttons[1].pressed = false;
  place.input.update();
  place.pad.buttons[3].pressed = true;
  place.input.update();
  place.itemThrow.update(0);
  place.interaction.update(0);
  assert.equal(place.station.state, 'processing', 'Triangle starts eligible Work with empty hands');
  place.station.update(1.8);
  assert.equal(place.station.getInteractionAction({ carry: place.carry }), InputAction.Interact);
  place.pad.buttons[3].pressed = false;
  place.input.update();
  place.pad.buttons[1].pressed = true;
  place.input.update();
  place.interaction.update(0);
  assert.equal(place.carry.hasItem, true, 'Circle picks up processed output');
  place.itemThrow.dispose();
  place.interaction.dispose();

  for (const kind of ['processing', 'assembly']) {
    const fixture = stationFixture(kind);
    for (const item of fixture.items) {
      assert.equal(fixture.carry.pickUp(item), true);
      fixture.pad.axes[0] = 1;
      fixture.pad.buttons[3].pressed = true;
      fixture.input.update();
      fixture.itemThrow.update(GAME_CONFIG.itemThrow.durationSeconds);
      assert.equal(fixture.itemThrow.activeThrowCount, 0);
      fixture.playerObject.position.x = 2.8;
      fixture.playerObject.rotation.y = Math.PI / 2;
      fixture.interaction.update(0);
      assert.notEqual(fixture.station.state, kind === 'processing' ? 'processing' : 'combining');
      fixture.pad.buttons[3].pressed = false;
      fixture.input.update();
      fixture.playerObject.position.x = 0;
      fixture.playerObject.rotation.y = 0;
    }
    assert.equal(fixture.station.state, kind === 'processing' ? 'loaded' : 'ready');
    fixture.playerObject.position.x = 2.8;
    fixture.playerObject.rotation.y = Math.PI / 2;
    assert.equal(fixture.station.getInteractionAction({ carry: fixture.carry }), InputAction.Work);
    fixture.pad.buttons[3].pressed = true;
    fixture.input.update();
    fixture.itemThrow.update(0);
    fixture.interaction.update(0);
    assert.equal(fixture.station.state, kind === 'processing' ? 'processing' : 'combining');
    fixture.itemThrow.dispose();
    fixture.interaction.dispose();
  }

  const vehicle = new WorldMapVehicle({
    speed: 4, acceleration: 100, deceleration: 100, turnSharpness: 10,
    bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
  });
  vehicle.update(0.1, { x: 0.5, y: 0 });
  near(vehicle.object.position.x, 0.2);
  vehicle.dispose();

  const phoneInput = {
    presses: new Set([InputAction.Interact]),
    consumeActionPress(action) {
      if (!this.presses.has(action)) return false;
      this.presses.delete(action);
      return true;
    },
  };
  const phoneUI = {
    setHandlers() {}, hide() {}, show() {}, dispose() {},
    renderHome() {},
    renderStoryCard(_card, handler) { this.handler = handler; return {}; },
  };
  let completed = 0;
  const phone = new PhoneController({
    input: phoneInput,
    progress: { snapshot: {} }, content: {},
    route: { nodes: [] }, worldProgress: { completedNodeIds: [] },
    settings: { subscribe: () => () => {}, snapshot: {} },
    returnToTitle() {},
    ui: phoneUI, canOpen: () => true, focusTarget: { focus() {} },
  });
  assert.equal(phone.presentStoryCard({}, () => { completed += 1; }), true);
  phone.update();
  phone.update();
  assert.equal(completed, 1);
  assert.equal(phone.isStoryPresenting, false);
  phoneInput.presses.add(InputAction.Phone);
  phone.update();
  assert.equal(phone.isOpen, true);
  phoneInput.presses.add(InputAction.Phone);
  phone.update();
  assert.equal(phone.isOpen, false);

  const doc = { activeElement: null };
  const makeButton = () => ({
    ownerDocument: doc, hidden: false, disabled: false, listeners: new Map(),
    addEventListener(type, callback) { this.listeners.set(type, callback); },
    removeEventListener(type) { this.listeners.delete(type); },
    focus() { doc.activeElement = this; },
    click() { this.listeners.get('click')?.(); },
  });
  const newButton = makeButton();
  const continueButton = makeButton();
  const resetButton = makeButton();
  const status = { textContent: '' };
  const controls = {
    '[data-start-new]': newButton,
    '[data-start-continue]': continueButton,
    '[data-start-reset]': resetButton,
    '[data-start-status]': status,
  };
  const menuElement = {
    hidden: true, ownerDocument: doc,
    querySelector(selector) { return controls[selector]; },
    setAttribute() {},
  };
  const menuInput = {
    y: 0, press: false,
    getMovement() { return { x: 0, y: this.y }; },
    consumeActionPress(action) {
      if (action !== InputAction.Interact || !this.press) return false;
      this.press = false;
      return true;
    },
  };
  const menu = new StartMenu(menuElement, menuInput);
  let newCount = 0;
  let continueCount = 0;
  menu.setHandlers({
    onNewGame: () => { newCount += 1; },
    onContinue: () => { continueCount += 1; },
    onResetProgress: () => {},
  });
  menu.show({ canContinue: false });
  assert.equal(doc.activeElement, newButton);
  menuInput.y = 1;
  menu.update();
  assert.equal(doc.activeElement, newButton);
  menuInput.press = true;
  menu.update();
  assert.equal(newCount, 1);
  menu.show({ canContinue: true });
  menuInput.y = 0;
  menu.update();
  menuInput.y = 1;
  menu.update();
  assert.equal(doc.activeElement, continueButton);
  menu.update();
  assert.equal(doc.activeElement, continueButton);
  menuInput.press = true;
  menu.update();
  assert.equal(continueCount, 1);
  menu.dispose();

  const keyboardSource = await source('../src/input/KeyboardInput.ts');
  for (const [code, action] of [
    ['KeyE', 'Interact'], ['Space', 'Dash'], ['KeyQ', 'Throw'],
    ['KeyR', 'Retry'], ['KeyF', 'Phone'], ['Escape', 'Back'],
  ]) assert.match(keyboardSource, new RegExp(`\\['${code}', InputAction\\.${action}\\]`));
  for (const code of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) assert.match(keyboardSource, new RegExp(code));

  const worldSource = await source('../src/world/WorldMapController.ts');
  assert.match(worldSource, /vehicle\.update\(deltaSeconds, this\.dependencies\.input\.getMovement\(\)\)/);
  assert.match(worldSource, /consumeActionPress\(InputAction\.Interact\)/);
  const menuSource = await source('../src/ui/StartMenu.ts');
  assert.match(menuSource, /consumeActionPress\(InputAction\.Interact\)/);
  assert.match(menuSource, /stickLatched/);
  const html = await source('../index.html');
  for (const hint of ['E / ○ : Next', 'Space / ×: Dash', 'E / ○: Interact', 'Q / △: Throw', 'E / △: Work', 'F / Options: Phone', 'R / ○: Retry']) {
    assert.ok(html.includes(hint), hint);
  }
  assert.doesNotMatch(html, /□/);
  assert.match(await source('../src/ui/InteractionPrompt.ts'), /action === InputAction\.Work \? '△' : '○'/);
  assert.match(await source('../src/ui/ResultOverlay.ts'), /R \/ ○/);
  assert.match(worldSource, /E \/ ○ : Enter/);
  assert.match(await source('../src/ui/phone/PhoneUI.ts'), /○ : Continue/);
  for (const [path, key] of [
    ['../src/save/GameSaveStore.ts', 'ur-game:save:v1'],
    ['../src/phone/PhoneProgressStore.ts', 'ur-game:phone-progress:v1'],
    ['../src/world/WorldProgressStore.ts', 'ur-game:world-progress:v1'],
  ]) assert.ok((await source(path)).includes(key), key);
  assert.equal(execFileSync('git', ['ls-files', 'public/private'], { encoding: 'utf8' }).trim(), '');

  console.log('Phase 21 browser-free validation passed.');
} finally {
  await server.close();
}
