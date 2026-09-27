import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

await import('./validate-phase-21.mjs');

const server = await createServer({
  appType: 'custom', logLevel: 'silent',
  server: { middlewareMode: true, hmr: false },
});
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`);

class MemoryStorage {
  data = new Map();
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, value); }
  removeItem(key) { this.data.delete(key); }
}

try {
  const load = (path) => server.ssrLoadModule(path);
  const { SettingsStore, SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS, parseSettings } = await load('/src/settings/SettingsStore.ts');
  const { SettingsController } = await load('/src/settings/SettingsController.ts');
  const { AudioManager } = await load('/src/audio/AudioManager.ts');
  const { AudioContentRegistry } = await load('/src/audio/AudioContentRegistry.ts');
  const { AudioMuteButton } = await load('/src/ui/AudioMuteButton.ts');
  const { InputAction } = await load('/src/input/InputAction.ts');
  const { PhoneController } = await load('/src/phone/PhoneController.ts');
  const { clearedMemories, profileView } = await load('/src/phone/PhoneHubData.ts');
  const { GameProgressController } = await load('/src/save/GameProgressController.ts');
  const { TransitionOverlay } = await load('/src/ui/TransitionOverlay.ts');

  const transitionClasses = new Set();
  const transitionStyles = new Map();
  const transitionText = new Map([
    ['[data-transition-eyebrow]', { textContent: '', hidden: true }],
    ['[data-transition-title]', { textContent: '' }],
    ['[data-transition-subtitle]', { textContent: '', hidden: true }],
  ]);
  let transitionRestarts = 0;
  const transitionElement = {
    hidden: true,
    classList: {
      add(name) { transitionClasses.add(name); },
      remove(name) { transitionClasses.delete(name); },
      toggle(name, enabled) {
        if (enabled) transitionClasses.add(name);
        else transitionClasses.delete(name);
      },
    },
    style: {
      setProperty(name, value) { transitionStyles.set(name, value); },
      removeProperty(name) { transitionStyles.delete(name); },
    },
    querySelector(selector) { return transitionText.get(selector) ?? null; },
    setAttribute() {},
    get offsetWidth() { transitionRestarts += 1; return 100; },
  };
  const transition = new TransitionOverlay(transitionElement);
  transition.show({ title: 'Next stage', durationSeconds: 2.2 });
  assert.equal(transitionRestarts, 1);
  assert.equal(transitionClasses.has('is-active'), true);
  transition.setPresentationPaused(true);
  assert.equal(transitionClasses.has('is-paused'), true);
  assert.equal(transitionElement.hidden, false);
  assert.equal(transitionText.get('[data-transition-title]').textContent, 'Next stage');
  assert.equal(transitionStyles.get('--transition-card-duration'), '2.2s');
  transition.setPresentationPaused(true);
  transition.setPresentationPaused(false);
  assert.equal(transitionClasses.has('is-paused'), false);
  assert.equal(transitionClasses.has('is-active'), true);
  assert.equal(transitionRestarts, 1, 'pause/resume must not restart the transition cycle');
  transition.hide();

  const storage = new MemoryStorage();
  const store = new SettingsStore(() => storage);
  assert.equal(SETTINGS_STORAGE_KEY, 'ur-game:settings:v1');
  assert.deepEqual(store.load(), {
    version: 1, masterVolume: 1, bgmVolume: 1, sfxVolume: 1, muted: false,
  });
  assert.deepEqual(store.load(), DEFAULT_SETTINGS);
  for (const bad of [
    null, [], { version: 2, masterVolume: 1, bgmVolume: 1, sfxVolume: 1, muted: false },
    { version: 1, masterVolume: NaN, bgmVolume: 1, sfxVolume: 1, muted: false },
    { version: 1, masterVolume: 1.01, bgmVolume: 1, sfxVolume: 1, muted: false },
    { version: 1, masterVolume: 1, bgmVolume: -0.1, sfxVolume: 1, muted: false },
    { version: 1, masterVolume: 1, bgmVolume: 1, sfxVolume: Infinity, muted: false },
    { version: 1, masterVolume: 1, bgmVolume: 1, sfxVolume: 1, muted: 'false' },
    { ...DEFAULT_SETTINGS, extra: true },
  ]) assert.equal(parseSettings(bad), null);
  storage.setItem(SETTINGS_STORAGE_KEY, '{bad json');
  assert.deepEqual(store.load(), DEFAULT_SETTINGS);
  storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, version: 2 }));
  assert.deepEqual(store.load(), DEFAULT_SETTINGS);
  storage.removeItem(SETTINGS_STORAGE_KEY);

  const media = [];
  const content = new AudioContentRegistry({ clips: [
    { id: 'bgm', kind: 'bgm', src: '/bgm.ogg', volume: 0.8 },
    { id: 'sfx', kind: 'sfx', src: '/sfx.ogg', volume: 0.6 },
  ] });
  const unlockTarget = new EventTarget();
  const audio = new AudioManager(content, {
    unlockTarget, defaultFadeSeconds: 0,
    createMedia: (src) => {
      const item = {
        src, loop: false, volume: 0, currentTime: 0,
        play: async () => {}, pause() {}, addEventListener() {}, removeEventListener() {},
      };
      media.push(item);
      return item;
    },
  });
  unlockTarget.dispatchEvent(new Event('pointerdown'));
  audio.playBgm('bgm', 0);
  audio.playSfx('sfx');
  const bgm = media.find((item) => item.src === '/bgm.ogg');
  const sfx = media.find((item) => item.src === '/sfx.ogg');
  near(bgm.volume, 0.8);
  near(sfx.volume, 0.6);
  audio.setVolumeLevels(0.5, 0.4, 0.2);
  near(bgm.volume, 0.8 * 0.5 * 0.4);
  near(sfx.volume, 0.6 * 0.5 * 0.2);
  audio.setMuted(true);
  assert.equal(bgm.volume, 0);
  assert.equal(sfx.volume, 0);
  audio.setMuted(false);
  near(bgm.volume, 0.16);
  near(sfx.volume, 0.06);
  audio.stopBgm(0);
  audio.playBgm('bgm', 2);
  const fadingBgm = media.filter((item) => item.src === '/bgm.ogg').at(-1);
  audio.update(1);
  near(fadingBgm.volume, 0.8 * 0.5 * 0.5 * 0.4);
  assert.throws(() => audio.setVolumeLevels(NaN, 1, 1), RangeError);

  const buttonElement = {
    listeners: new Map(), attributes: new Map(), textContent: '',
    addEventListener(type, listener) { this.listeners.set(type, listener); },
    removeEventListener(type) { this.listeners.delete(type); },
    setAttribute(key, value) { this.attributes.set(key, value); },
    click() { this.listeners.get('click')?.(); },
  };
  const muteButton = new AudioMuteButton(buttonElement);
  const settings = new SettingsController(audio, muteButton, store);
  let changeCount = 0;
  const unsubscribe = settings.subscribe(() => { changeCount += 1; });
  settings.setVolume('masterVolume', 0.75);
  assert.equal(store.load().masterVolume, 0.75);
  buttonElement.click();
  assert.equal(settings.snapshot.muted, true);
  assert.equal(store.load().muted, true);
  assert.equal(buttonElement.textContent, 'Sound Off');
  settings.setMuted(false);
  assert.equal(buttonElement.textContent, 'Sound On');
  assert.equal(store.load().muted, false);
  assert.equal(changeCount, 3);
  assert.equal(new SettingsStore(() => storage).load().masterVolume, 0.75);
  unsubscribe();
  muteButton.dispose();
  audio.dispose();

  const route = { nodes: [
    { id: 'a', label: '1-1', stageLabel: 'Cafe' },
    { id: 'b', label: '1-2', stageLabel: 'Park' },
    { id: 'c', label: '1-3', stageLabel: 'Prep' },
  ] };
  const worldProgress = { completedNodeIds: ['a', 'b'] };
  assert.deepEqual(clearedMemories(route, worldProgress), [
    { id: 'a', routeLabel: '1-1', stageLabel: 'Cafe', state: 'Cleared' },
    { id: 'b', routeLabel: '1-2', stageLabel: 'Park', state: 'Cleared' },
  ]);
  assert.deepEqual(profileView({
    storyDate: 'Day 2', currentObjective: { id: 'goal', text: 'Visit the park' },
    unlockedMessageIds: ['m1'], unlockedPhotoIds: ['p1', 'p2'],
  }, 2), {
    name: 'You', storyDate: 'Day 2', objective: 'Visit the park',
    completedRouteCount: 2, unlockedMessageCount: 1, unlockedPhotoCount: 2,
  });

  const input = {
    presses: new Set(), movement: { x: 0, y: 0 },
    press(action) { this.presses.add(action); },
    consumeActionPress(action) { return this.presses.delete(action); },
    getMovement() { return this.movement; },
  };
  const calls = [];
  const ui = {
    setHandlers(handlers) { this.handlers = handlers; },
    hide() { calls.push('hide'); }, show() { calls.push('show'); }, dispose() {},
    renderHome(_snapshot, messages, album, memories, profile, settingsAction) {
      this.homeActions = { messages, album, memories, profile, settingsAction };
      calls.push('home');
    },
    renderMessages() { calls.push('messages'); },
    renderAlbum() { calls.push('album'); },
    renderMemories() { calls.push('memories'); },
    renderProfile() { calls.push('profile'); },
    renderSettings(_settings, _volume, _mute, returnAction) {
      this.settingsReturnAction = returnAction;
      calls.push('settings');
    },
    renderReturnConfirmation(cancel, confirm) { this.confirmActions = { cancel, confirm }; calls.push('confirm'); },
    renderStoryCard(_card, action) { this.storyAction = action; return {}; },
    focusDefault() { calls.push('focus'); },
    activateFocused() { calls.push('activate'); },
    moveFocus(direction) { calls.push(`move:${direction}`); },
    adjustFocusedSlider(direction) { calls.push(`slider:${direction}`); return false; },
    updateSettings() { calls.push('settings-update'); },
  };
  let active = false;
  let returned = 0;
  const phone = new PhoneController({
    input,
    progress: { snapshot: {
      storyDate: null, currentObjective: null, unlockedMessageIds: [], unlockedPhotoIds: [],
    } },
    content: { getMessage() {}, getThread() {}, getPhoto() {} },
    route, worldProgress, settings,
    ui, canOpen: () => active,
    returnToTitle: () => { returned += 1; phone.close(); },
    focusTarget: { focus() {} },
  });
  input.press(InputAction.Phone);
  phone.update();
  assert.equal(phone.isNormalOpen, false, 'Start Menu owns the app');
  active = true; // EventRunner may be running and World Map may be active.
  input.press(InputAction.Phone);
  phone.update();
  assert.equal(phone.isNormalOpen, true);
  transition.show({ title: 'Between stages', durationSeconds: 2.2 });
  transition.setPresentationPaused(phone.consumeSimulationGate());
  assert.equal(transitionClasses.has('is-paused'), true);
  assert.equal(transitionRestarts, 2);
  phone.update(); // neutral re-arms navigation after opening while driving
  input.movement.y = 1;
  phone.update();
  phone.update();
  assert.equal(calls.filter((item) => item === 'move:down').length, 1);
  input.movement.y = 0;
  phone.update();
  input.movement.x = 1;
  phone.update();
  assert.ok(calls.includes('move:right'));
  input.movement.x = 0;
  input.press(InputAction.Interact);
  phone.update();
  assert.ok(calls.includes('activate'));
  ui.homeActions.settingsAction();
  assert.ok(calls.includes('settings'));
  settings.setMuted(true);
  assert.ok(calls.includes('settings-update'));
  input.press(InputAction.Back);
  phone.update();
  assert.equal(calls.at(-2), 'home');
  input.press(InputAction.Phone);
  phone.update();
  assert.equal(phone.isNormalOpen, false);
  const closingGate = phone.consumeSimulationGate();
  assert.equal(closingGate, true, 'close frame stays gated');
  transition.setPresentationPaused(closingGate);
  assert.equal(transitionClasses.has('is-paused'), true, 'visual remains paused on close frame');
  const resumedGate = phone.consumeSimulationGate();
  assert.equal(resumedGate, false, 'next frame may resume');
  transition.setPresentationPaused(resumedGate);
  assert.equal(transitionClasses.has('is-paused'), false);
  assert.equal(transitionClasses.has('is-active'), true);
  assert.equal(transitionRestarts, 2, 'closing the Smartphone cannot restart the card');
  transition.hide();
  assert.equal(returned, 0);
  input.press(InputAction.Phone);
  phone.update();
  ui.homeActions.settingsAction();
  ui.settingsReturnAction();
  assert.ok(calls.includes('confirm'));
  ui.confirmActions.cancel();
  assert.equal(returned, 0);
  ui.settingsReturnAction();
  ui.confirmActions.confirm();
  assert.equal(returned, 1);
  assert.equal(phone.consumeSimulationGate(), true);
  assert.equal(phone.presentStoryCard({}, () => { returned += 1; }), true);
  input.press(InputAction.Phone);
  phone.update();
  assert.equal(phone.isStoryPresenting, true, 'Options cannot replace a story card');
  input.press(InputAction.Interact);
  phone.update();
  assert.equal(returned, 2);
  phone.dispose();

  const saveState = { checkpointId: 'checkpoint-a', clears: 0 };
  const phoneState = { resets: 0 };
  const worldState = { resets: 0 };
  const scene = {
    currentSceneId: 'stage-a',
    loadScene(id) { this.currentSceneId = id; },
    unloadScene() { this.currentSceneId = null; },
  };
  let menuShown = 0;
  const progressController = new GameProgressController({
    initialCheckpointId: 'checkpoint-a',
    checkpoints: { getCheckpoint: () => ({
      id: 'checkpoint-a', sceneId: 'stage-a', phoneProgress: {}, resumeSequence: null,
    }) },
    saveStore: {
      clear() { saveState.clears += 1; saveState.checkpointId = null; },
      save(data) { saveState.checkpointId = data.checkpointId; },
      load() { return saveState.checkpointId ? { version: 1, checkpointId: saveState.checkpointId } : null; },
    },
    sceneManager: scene,
    eventRunner: { reset() {}, start: () => true },
    phoneProgress: { reset() { phoneState.resets += 1; }, replace() {} },
    phone: { close() {} },
    player: { setMovementEnabled() {} },
    interaction: { setEnabled() {}, reset() {} },
    npcs: new Map(),
    menu: { setHandlers() {}, setBusy() {}, hide() {}, show() { menuShown += 1; }, dispose() {} },
    focusTarget: { focus() {} },
    worldMap: { hide() {} },
    worldProgress: { reset() { worldState.resets += 1; }, restoreForCheckpoint() {} },
  });
  progressController.startNewGame();
  const clearsBefore = saveState.clears;
  const phoneResetsBefore = phoneState.resets;
  const worldResetsBefore = worldState.resets;
  scene.currentSceneId = null; // Return from the World Map also reinstalls the title scene.
  progressController.returnToTitle();
  assert.equal(saveState.checkpointId, 'checkpoint-a');
  assert.equal(saveState.clears, clearsBefore);
  assert.equal(phoneState.resets, phoneResetsBefore);
  assert.equal(worldState.resets, worldResetsBefore);
  assert.equal(progressController.isGameActive, false);
  assert.equal(scene.currentSceneId, 'stage-a');
  assert.equal(menuShown, 1);
  progressController.continueGame();
  assert.equal(progressController.isGameActive, true);
  progressController.dispose();

  const gameSource = await read('../src/core/Game.ts');
  assert.match(gameSource, /canOpen: \(\) => progressTarget\?\.isGameActive === true/);
  const frame = gameSource.slice(gameSource.indexOf('private readonly frame ='));
  const inputIndex = frame.indexOf('this.input.update()');
  const phoneIndex = frame.indexOf('this.phone.update()');
  const gateIndex = frame.indexOf('if (!simulationGated && this.progress.isGameActive)');
  const transitionPauseIndex = frame.indexOf('this.transition.setPresentationPaused(simulationGated)');
  const audioIndex = frame.indexOf('this.audio.update(deltaSeconds)');
  const renderIndex = frame.indexOf('this.renderer.render(this.scene, this.camera)');
  assert.ok(inputIndex >= 0 && inputIndex < phoneIndex && phoneIndex < transitionPauseIndex);
  assert.ok(transitionPauseIndex < gateIndex, 'transition presentation follows the same gate as EventRunner');
  assert.ok(gateIndex < audioIndex && audioIndex < renderIndex);
  const gated = frame.slice(gateIndex, audioIndex);
  for (const call of [
    'this.worldMap.update(deltaSeconds)', 'this.itemThrow.update(deltaSeconds)',
    'npc.update(deltaSeconds)', 'this.player.updateBeforePhysics(deltaSeconds)',
    'this.physics.step(deltaSeconds)', 'this.player.updateAfterPhysics(deltaSeconds)',
    'this.dashBump.updateAfterPlayerResolution()', 'this.interaction.update(deltaSeconds)',
    'this.eventRunner.update(deltaSeconds)', 'this.worldMap.commitPendingTransition()',
    'this.sceneManager.updatePresentation(deltaSeconds)', 'this.worldMap.updateCamera(deltaSeconds)',
    'this.followCamera.update(deltaSeconds)', 'this.speechBubble.update(this.camera, deltaSeconds)',
  ]) assert.ok(gated.includes(call), `${call} must be gated`);
  const css = await read('../src/style.css');
  const transitionZIndex = Number(css.match(/\.transition-overlay\s*\{[^}]*z-index:\s*(\d+)/s)?.[1]);
  const phoneZIndex = Number(css.match(/\.phone-overlay\s*\{[^}]*z-index:\s*(\d+)/s)?.[1]);
  assert.ok(phoneZIndex > transitionZIndex, 'Smartphone must receive input above Transition Card');
  assert.match(css, /\.transition-overlay\.is-active\.is-paused,\s*\.transition-overlay\.is-active\.is-paused \.transition-card\s*\{\s*animation-play-state:\s*paused;/);
  assert.ok(frame.indexOf('this.lastFrameTime = timestamp') < phoneIndex);
  assert.doesNotMatch(await read('../src/phone/PhoneController.ts'), /setMovementEnabled|setEnabled\(|cancelAll|reset\(/);
  assert.doesNotMatch(await read('../src/save/GameProgressController.ts'), /location\.reload/);
  const uiSource = await read('../src/ui/phone/PhoneUI.ts');
  assert.match(uiSource, /slider\.step = '0\.05'/);
  assert.match(uiSource, /Math\.round\(settings\[key\] \* 100\)/);
  assert.match(uiSource, /renderReturnConfirmation/);
  const gamepadSource = await read('../src/input/GamepadInput.ts');
  for (const mapping of [
    /\[InputAction\.Dash, 0\]/, /\[InputAction\.Back, 0\]/,
    /\[InputAction\.Interact, 1\]/, /\[InputAction\.Retry, 1\]/,
    /\[InputAction\.Throw, 3\]/, /\[InputAction\.Work, 3\]/,
    /\[InputAction\.Phone, 9\]/,
  ]) assert.match(gamepadSource, mapping);
  assert.doesNotMatch(gamepadSource, /InputAction\.[A-Za-z]+, 2\]/);
  assert.match(gamepadSource, /DEFAULT_GAMEPAD_DEADZONE = 0\.18/);
  for (const [path, key] of [
    ['../src/save/GameSaveStore.ts', 'ur-game:save:v1'],
    ['../src/phone/PhoneProgressStore.ts', 'ur-game:phone-progress:v1'],
    ['../src/world/WorldProgressStore.ts', 'ur-game:world-progress:v1'],
  ]) assert.ok((await read(path)).includes(key));
  assert.equal(execFileSync('git', ['ls-files', 'public/private'], { encoding: 'utf8' }).trim(), '');

  console.log('Phase 22 browser-free validation passed.');
} finally {
  await server.close();
}
