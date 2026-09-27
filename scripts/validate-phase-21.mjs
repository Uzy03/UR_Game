import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
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
  assert.equal(wakeInput.wasActionPressed(InputAction.Interact), true);
  assert.equal(wakeInput.wasActionPressed(InputAction.Retry), true);
  wakeInput.update();
  assert.equal(wakeInput.wasActionPressed(InputAction.Interact), false);
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
  for (const action of Object.values(InputAction)) {
    assert.equal(gamepad.isActionPressed(action), true, `${action} held`);
    assert.equal(gamepad.wasActionPressed(action), true, `${action} edge`);
  }
  gamepad.update();
  for (const action of Object.values(InputAction)) {
    assert.equal(gamepad.isActionPressed(action), true);
    assert.equal(gamepad.wasActionPressed(action), false, `${action} must not repeat`);
  }
  first.connected = false;
  second.axes = [0.7, 0];
  second.buttons[0].pressed = true;
  gamepad.update();
  assert.equal(gamepad.wasActionPressed(InputAction.Interact), false);
  assert.equal(gamepad.wasActionPressed(InputAction.Retry), false);
  near(gamepad.getMovement().x, (0.7 - 0.18) / 0.82);
  second.buttons[0].pressed = false;
  gamepad.update();
  second.buttons[0].pressed = true;
  gamepad.update();
  assert.equal(gamepad.wasActionPressed(InputAction.Interact), true);
  pads = [null, null];
  gamepad.update();
  assert.deepEqual(gamepad.getMovement(), { x: 0, y: 0 });
  assert.equal(gamepad.isActionPressed(InputAction.Interact), false);
  assert.equal(gamepad.wasActionPressed(InputAction.Interact), false);
  first.connected = true;
  first.axes = [0, 0];
  first.buttons[0].pressed = false;
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
    renderStoryCard(_card, handler) { this.handler = handler; return {}; },
  };
  let completed = 0;
  const phone = new PhoneController({
    input: phoneInput, player: {}, interaction: {}, progress: {}, content: {},
    ui: phoneUI, canOpen: () => true, focusTarget: { focus() {} },
  });
  assert.equal(phone.presentStoryCard({}, () => { completed += 1; }), true);
  phone.update();
  phone.update();
  assert.equal(completed, 1);
  assert.equal(phone.isStoryPresenting, false);

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
  for (const hint of ['E / × : Next', 'Space / ○: Dash', 'Q / □: Throw', 'F / △: Phone', 'R / ×: Retry', 'Esc / Options: Back']) {
    assert.ok(html.includes(hint), hint);
  }
  assert.match(await source('../src/ui/InteractionPrompt.ts'), /E \/ ×/);
  assert.match(await source('../src/ui/ResultOverlay.ts'), /R \/ ×/);
  assert.match(worldSource, /E \/ × : Enter/);
  assert.match(await source('../src/ui/phone/PhoneUI.ts'), /× : Continue/);
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
