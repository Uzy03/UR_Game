import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createServer } from 'vite';

await import('./validate-phase-22.mjs');
const server = await createServer({ appType: 'custom', logLevel: 'silent',
  server: { middlewareMode: true, hmr: false } });
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
class MemoryStorage {
  data = new Map();
  writes = [];
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.writes.push(key); this.data.set(key, String(value)); }
  removeItem(key) { this.writes.push(key); this.data.delete(key); }
}
try {
  const load = (path) => server.ssrLoadModule(path);
  const { ReplayController } = await load('/src/replay/ReplayController.ts');
  const { projectReplaySequence, assertRuntimeOnlyResume } = await load('/src/replay/ReplaySequence.ts');
  const { GameProgressController } = await load('/src/save/GameProgressController.ts');
  const { GameSaveStore } = await load('/src/save/GameSaveStore.ts');
  const { PhoneProgress } = await load('/src/phone/PhoneProgress.ts');
  const { PhoneProgressStore } = await load('/src/phone/PhoneProgressStore.ts');
  const { PhoneContentRegistry } = await load('/src/phone/PhoneContentRegistry.ts');
  const { WorldRoute } = await load('/src/world/WorldRoute.ts');
  const { WorldProgress } = await load('/src/world/WorldProgress.ts');
  const { WorldProgressStore } = await load('/src/world/WorldProgressStore.ts');
  const { EventRunner } = await load('/src/events/EventRunner.ts');
  const { PhoneController } = await load('/src/phone/PhoneController.ts');
  const { InputAction } = await load('/src/input/InputAction.ts');
  const { SettingsStore } = await load('/src/settings/SettingsStore.ts');
  const { SettingsController } = await load('/src/settings/SettingsController.ts');
  const { clearedMemories } = await load('/src/phone/PhoneHubData.ts');

  // Validate every existing route projection against the real content registries.
  const { createCampaignContent } = await load('/src/content/campaign/campaignContent.ts');
  const { FICTIONAL_CAMPAIGN_STORY } = await load('/src/content/campaign/fictionalCampaignStory.ts');
  const { SceneContentRegistry } = await load('/src/scene/SceneContentRegistry.ts');
  const { AudioContentRegistry } = await load('/src/audio/AudioContentRegistry.ts');
  const { CheckpointRegistry } = await load('/src/save/CheckpointRegistry.ts');
  const campaign = createCampaignContent(FICTIONAL_CAMPAIGN_STORY);
  const campaignRegistry = new CheckpointRegistry(campaign.checkpoints,
    new SceneContentRegistry(campaign.scenes), new PhoneContentRegistry(campaign.phoneContent),
    new AudioContentRegistry(campaign.audioContent));
  const kept = new Set(['audio_cue', 'transition_card', 'change_scene', 'dialogue',
    'task', 'move_npc', 'speech', 'wait', 'phone_story']);
  const suppressed = ['set_date', 'set_objective', 'unlock_message', 'unlock_photo', 'set_checkpoint', 'world_map'];
  for (const node of campaign.worldRoute.nodes) {
    const original = JSON.stringify(node.entrySequence);
    const replay = projectReplaySequence(node.entrySequence);
    assert.equal(replay.id, `${node.entrySequence.id}:replay`);
    assert.deepEqual(replay.events, node.entrySequence.events.filter(({ type }) => kept.has(type)));
    assert.equal(JSON.stringify(node.entrySequence), original);
    assert.notEqual(replay.events, node.entrySequence.events);
    campaignRegistry.validateRuntimeSequence(replay);
    assertRuntimeOnlyResume(campaignRegistry.getCheckpoint(node.completionCheckpointId).resumeSequence);
  }
  assert.ok(projectReplaySequence(campaign.worldRoute.nodes.at(-1).entrySequence)
    .events.some(({ type }) => type === 'phone_story'), 'Ending presentation is retained');

  // Use unrelated IDs, all event types, and both world_map actions to prove generic behavior.
  const local = [
    { type: 'audio_cue', cue: { kind: 'play_bgm', audioId: 'music' } },
    { type: 'transition_card', card: { id: 'card', title: 'Stage', durationSeconds: 0.2 } },
    { type: 'change_scene', sceneId: 'arena' },
    { type: 'dialogue', sequence: { id: 'talk', lines: [] } },
    { type: 'task', taskId: 'job' },
    { type: 'move_npc', npcId: 'friend', position: { x: 1, y: 0, z: 0 } },
    { type: 'speech', npcId: 'friend', text: 'Done', durationSeconds: 1 },
    { type: 'wait', durationSeconds: 0.2 },
    { type: 'phone_story', card: { id: 'ending', appLabel: 'Story', title: 'End', body: 'End', actionLabel: 'OK' } },
  ];
  const source = { id: 'unrelated-entry', events: [
    local[0], { type: 'set_date', date: '2026-01-01' }, local[1],
    { type: 'set_objective', objective: null }, local[2],
    { type: 'unlock_message', messageId: 'message' }, local[3],
    { type: 'unlock_photo', photoId: 'photo' }, ...local.slice(4),
    { type: 'world_map', action: 'show' },
    { type: 'set_checkpoint', checkpointId: 'saved' },
    { type: 'world_map', action: 'complete_node', nodeId: 'alpha' },
  ] };
  assert.deepEqual(projectReplaySequence(source), { id: 'unrelated-entry:replay', events: local });
  for (const type of suppressed) assert.ok(!projectReplaySequence(source).events.some((event) => event.type === type));
  assert.throws(() => projectReplaySequence({ id: 'bad', events: [{ type: 'unknown' }] }));
  assert.throws(() => projectReplaySequence({ id: 'empty', events: [] }));
  assert.throws(() => assertRuntimeOnlyResume(source));

  const vector = { x: 0, y: 0, z: 0 };
  const route = new WorldRoute({ initialCheckpointId: 'initial', initialVehicleSpawn: vector, nodes: [
    { id: 'alpha', label: 'A', stageLabel: 'Arena', position: vector, vehicleSpawn: vector,
      completionCheckpointId: 'saved', entrySequence: source },
    { id: 'beta', label: 'B', stageLabel: 'Next', position: vector, vehicleSpawn: vector,
      completionCheckpointId: 'next', entrySequence: { id: 'next-entry', events: [
        { type: 'set_checkpoint', checkpointId: 'next' }, { type: 'world_map', action: 'complete_node', nodeId: 'beta' },
      ] } },
  ] });
  const storage = new MemoryStorage();
  const saveStore = new GameSaveStore(() => storage);
  const phoneContent = new PhoneContentRegistry({ threads: [], messages: [], photos: [] });
  const phoneProgress = new PhoneProgress(phoneContent, new PhoneProgressStore(() => storage));
  const worldProgress = new WorldProgress(route, new WorldProgressStore(() => storage));
  const checkpoint = { id: 'saved', sceneId: 'canonical', phoneProgress: {
    version: 1, storyDate: '2026-01-01', currentObjective: null, unlockedMessageIds: [], unlockedPhotoIds: [],
  }, resumeSequence: { id: 'canonical-resume', events: [{ type: 'world_map', action: 'show', bgmId: 'canonical-music' }] } };
  const initial = { ...checkpoint, id: 'initial', resumeSequence: null };
  const checkpoints = { getCheckpoint(id) { return id === 'saved' ? checkpoint : id === 'initial' ? initial : undefined; } };
  saveStore.save({ version: 1, checkpointId: 'saved' });
  phoneProgress.replace(checkpoint.phoneProgress);
  worldProgress.completeNode('alpha');
  const mutations = [];
  let protectedProgress = false;
  for (const [object, names] of [
    [saveStore, ['save', 'clear']],
    [phoneProgress, ['setStoryDate', 'setObjective', 'unlockMessage', 'unlockPhoto', 'replace', 'reset']],
    [worldProgress, ['completeNode', 'restoreForCheckpoint', 'reset']],
  ]) for (const name of names) {
    const method = object[name].bind(object);
    object[name] = (...args) => {
      assert.equal(protectedProgress, false, `Replay must not call ${name}`);
      mutations.push(name);
      return method(...args);
    };
  }
  const canonicalKeys = ['ur-game:save:v1', 'ur-game:phone-progress:v1', 'ur-game:world-progress:v1'];
  const snapshot = () => canonicalKeys.map((key) => storage.getItem(key));
  const before = snapshot();
  const canonicalPhone = phoneProgress.snapshot;
  const canonicalWorld = worldProgress.snapshot;
  const assertIsolated = () => {
    assert.deepEqual(snapshot(), before);
    assert.deepEqual(phoneProgress.snapshot, canonicalPhone);
    assert.deepEqual(worldProgress.snapshot, canonicalWorld);
    assert.equal(new GameSaveStore(() => storage).load().checkpointId, 'saved', 'refresh keeps canonical Continue');
  };

  const input = { presses: new Set(), press(action) { this.presses.add(action); },
    consumeActionPress(action) { return this.presses.delete(action); }, getMovement() { return { x: 0, y: 0 }; } };
  const player = { isMovementEnabled: true, setMovementEnabled(value) { this.isMovementEnabled = value; } };
  const interaction = { isInteractionEnabled: true, resets: 0,
    setEnabled(value) { this.isInteractionEnabled = value; }, reset() { this.resets += 1; } };
  const npc = { isInteractionEnabled: true, isMoving: false,
    setInteractionEnabled(value) { this.isInteractionEnabled = value; }, moveTo() {}, stop() {} };
  const npcs = new Map([['friend', npc]]);
  const tasks = new Map([['job', { task: { id: 'job' }, prepareAttempt() {} }]]);
  const taskManager = { currentTask: null, resets: 0,
    setFinishedHandler(handler) { this.finished = handler; },
    start(task) { this.currentTask = task; },
    reset() { this.resets += 1; this.currentTask = null; },
    update() { if (this.currentTask) this.finished(this.currentTask, 'succeeded'); },
  };
  const dialogue = { start(_sequence, callback) { this.done = callback; },
    update() { this.done?.(); this.done = null; }, close() { this.done = null; } };
  const scene = { currentSceneId: null, loads: [],
    loadScene(id) { this.currentSceneId = id; this.loads.push(id); }, unloadScene() { this.currentSceneId = null; } };
  const worldMap = { visible: false, pending: false, completions: 0,
    hide() { this.visible = false; this.pending = false; },
    showWorldMap() { this.pending = true; },
    completeNodeAndShow(id) { this.completions += 1; worldProgress.completeNode(id); this.pending = true; },
    commitPendingTransition() { if (this.pending) { this.visible = true; this.pending = false; } },
  };
  const audio = { cues: [], playBgm(id) { this.cues.push(id); }, playSfx() {}, stopBgm() {},
    setMuted() {}, setVolumeLevels() {} };
  const settings = new SettingsController(audio, { setMuted() {}, setToggleHandler() {} }, new SettingsStore(() => storage));
  const ui = { setHandlers() {}, hide() {}, show() {}, dispose() {}, focusDefault() {},
    renderHome(_s, _m, _a, memories, _p, settings) { this.memories = memories; this.settings = settings; },
    renderMemories(entries, actions) { this.entries = entries; this.memoryActions = actions; },
    renderReplayConfirmation(entry, cancel, confirm) { this.confirmation = { entry, cancel, confirm }; },
    renderExitReplayConfirmation(cancel, confirm) { this.exitConfirmation = { cancel, confirm }; },
    renderSettings() {}, updateSettings() {},
    renderStoryCard(_card, done) { this.storyDone = done; return {}; },
    activateFocused() {}, moveFocus() {}, adjustFocusedSlider() { return false; },
  };
  const hideUi = { hide() {}, update() {}, show() {} };
  let game, replay;
  const phone = new PhoneController({ input, progress: phoneProgress, content: phoneContent,
    route, worldProgress, settings, ui, canOpen: () => game?.isGameActive === true,
    returnToTitle: () => game.returnToTitle(), focusTarget: { focus() {} },
    replay: { get activeNode() { return replay?.activeNode ?? null; },
      start: (id) => replay.start(id), exit: () => replay.exit() },
  });
  const runner = new EventRunner({ input, player, interaction, dialogue, taskManager,
    taskHud: hideUi, resultOverlay: hideUi, speechBubble: hideUi, npcs, tasks,
    phoneProgress, phoneStory: phone, scenes: scene,
    checkpoints: { setCheckpoint(id) { game.setCheckpoint(id); } },
    transition: hideUi, audio, worldMap,
  }, { successResultDurationSeconds: 0 });
  const menu = { setHandlers() {}, setBusy() {}, show() {}, hide() {}, dispose() {} };
  game = new GameProgressController({ initialCheckpointId: 'initial', checkpoints, saveStore,
    sceneManager: scene, eventRunner: runner, phoneProgress, phone, player, interaction, npcs,
    menu, focusTarget: { focus() {} }, worldMap, worldProgress, clearReplay: () => replay?.clear() });
  replay = new ReplayController({ route, progress: worldProgress, saveStore, checkpoints, runner,
    isGameActive: () => game.isGameActive, validateSequence(sequence) {
      assert.ok(sequence.events.every((event) => kept.has(event.type) || (event.type === 'world_map' && event.action === 'show')));
    }, startRuntime: (sequence) => game.startReplayRuntime(sequence),
    restoreRuntime: (saved) => game.restoreReplayRuntime(saved) });
  game.continueGame();
  assert.ok(mutations.includes('replace') && mutations.includes('restoreForCheckpoint'), 'Continue fully reconstructs progress');
  runner.update(0.1); worldMap.commitPendingTransition();
  assert.equal(worldMap.visible, true);
  assert.deepEqual(clearedMemories(route, worldProgress).map(({ id }) => id), ['alpha']);
  protectedProgress = true;
  const writeCount = storage.writes.length;
  const tick = () => {
    phone.update();
    if (!phone.consumeSimulationGate() && game.isGameActive) {
      runner.update(0.1); replay.update(); worldMap.commitPendingTransition();
    }
    assertIsolated();
  };
  assert.match(replay.start('unknown'), /cleared/);
  assert.match(replay.start('beta'), /cleared/);
  assertIsolated();
  phone.open(); ui.memories();
  ui.memoryActions.onReplay('alpha');
  assert.equal(ui.confirmation.entry.id, 'alpha');
  ui.confirmation.cancel();
  assert.equal(replay.activeNode, null);
  ui.memoryActions.onReplay('alpha'); ui.confirmation.confirm();
  assert.equal(phone.isOpen, false);
  assert.equal(replay.activeNode.id, 'alpha');
  assert.equal(worldMap.visible, false);
  assert.match(replay.start('alpha'), /current Replay/);
  // Settings may persist while all three campaign stores stay byte-identical.
  settings.setVolume('masterVolume', 0.5);
  assert.equal(new SettingsStore(() => storage).load().masterVolume, 0.5);
  phone.open(); ui.memories();
  assert.equal(ui.memoryActions.activeLabel, 'A · Arena');
  const eventBeforePause = runner.currentEventIndex;
  for (let i = 0; i < 20; i++) tick();
  assert.equal(runner.currentEventIndex, eventBeforePause);
  phone.close(); tick();
  assert.equal(runner.currentEventIndex, eventBeforePause, 'close frame remains gated');
  for (let i = 0; i < 100 && replay.activeNode !== null; i++) {
    if (phone.isStoryPresenting) input.press(InputAction.Interact);
    tick();
  }
  assert.equal(replay.activeNode, null, 'Replay completion restores canonical runtime');
  assert.equal(scene.loads.at(-1), 'canonical');
  assert.equal(runner.currentSequenceId, 'canonical-resume');
  tick();
  assert.equal(worldMap.visible, true);
  assert.equal(audio.cues.at(-1), 'canonical-music');
  assert.equal(worldMap.completions, 0);
  assert.equal(worldProgress.availableNode.id, 'beta');
  assert.deepEqual(storage.writes.slice(writeCount), ['ur-game:settings:v1']);

  // Bad save/sequence preflight must leave the normal Memories UI and runtime intact.
  const loadSave = saveStore.load.bind(saveStore);
  saveStore.load = () => null;
  phone.open(); ui.memories(); ui.memoryActions.onReplay('alpha'); ui.confirmation.confirm();
  assert.equal(phone.isNormalOpen, true);
  assert.match(ui.memoryActions.error, /checkpoint/);
  assert.equal(replay.activeNode, null);
  saveStore.load = loadSave;
  phone.close(); tick();
  let prepared = 0;
  const preflight = (overrides) => new ReplayController({ route, progress: worldProgress, saveStore,
    checkpoints, runner: { setCompletedHandler() {} }, isGameActive: () => true,
    validateSequence() {}, startRuntime() { prepared += 1; }, restoreRuntime() { return true; }, ...overrides });
  assert.match(preflight({ saveStore: { load: () => ({ checkpointId: 'missing' }) } }).start('alpha'), /checkpoint/);
  assert.match(preflight({ checkpoints: { getCheckpoint: () => ({ ...checkpoint, resumeSequence: source }) } }).start('alpha'), /change campaign/);
  assert.match(preflight({ route: { getNode: () => ({ ...route.nodes[0], entrySequence: { id: 'bad', events: [] } }) } }).start('alpha'), /scene/);
  assert.match(preflight({ validateSequence() { throw new Error('Invalid scene'); } }).start('alpha'), /Invalid scene/);
  assert.equal(prepared, 0);
  assertIsolated();

  // Runtime errors recover through the same runtime-only restore, without progressing.
  const originalError = console.error;
  const expectedErrors = [];
  console.error = (...args) => expectedErrors.push(args);
  try {
    tasks.delete('job');
    assert.equal(replay.start('alpha'), null);
    for (let i = 0; i < 50 && replay.activeNode !== null; i++) tick();
    assert.equal(replay.activeNode, null);
    assert.equal(runner.currentSequenceId, 'canonical-resume');
    assert.ok(expectedErrors.length >= 2);
    tasks.set('job', { task: { id: 'job' }, prepareAttempt() {} });
    const originalStart = runner.start.bind(runner);
    let rejectOnce = true;
    runner.start = (sequence) => {
      if (rejectOnce) { rejectOnce = false; return false; }
      return originalStart(sequence);
    };
    assert.match(replay.start('alpha'), /could not start/);
    assert.equal(replay.activeNode, null);
    assert.equal(game.isGameActive, true);
    assert.equal(runner.currentSequenceId, 'canonical-resume');
    runner.start = originalStart;
    assertIsolated();
  } finally { console.error = originalError; }

  // Exit while an existing task is active; cancel only transient state.
  runner.start({ id: 'canonical-task', events: [{ type: 'task', taskId: 'job' }] });
  runner.update(0);
  const resets = taskManager.resets;
  assert.equal(replay.start('alpha'), null);
  assert.ok(taskManager.resets > resets);
  phone.open(); ui.memories(); ui.memoryActions.onExit();
  ui.exitConfirmation.cancel(); assert.ok(replay.activeNode);
  ui.memoryActions.onExit(); ui.exitConfirmation.confirm();
  assert.equal(replay.activeNode, null);
  assert.equal(scene.currentSceneId, 'canonical');
  assert.equal(runner.currentSequenceId, 'canonical-resume');
  assertIsolated();
  assert.equal(replay.start('alpha'), null);
  game.returnToTitle();
  assert.equal(replay.activeNode, null);
  assert.equal(game.isGameActive, false);
  assert.equal(phone.open(), false);
  assert.match(replay.start('alpha'), /Start a game/);
  assertIsolated();
  protectedProgress = false;
  mutations.length = 0;
  game.continueGame();
  assert.deepEqual(mutations, ['replace', 'restoreForCheckpoint']);
  assert.equal(scene.currentSceneId, 'canonical');
  assert.equal(runner.currentSequenceId, 'canonical-resume');
  // Ordinary checkpoint/route completion retains its original writes.
  game.setCheckpoint('saved');
  assert.equal(mutations.at(-1), 'save');
  worldProgress.completeNode('beta');
  assert.equal(mutations.at(-1), 'completeNode');
  game.startNewGame();
  assert.ok(mutations.includes('clear') && mutations.includes('reset'));
  assert.equal(saveStore.load().checkpointId, 'initial');
  assert.equal(worldProgress.completedNodeIds.length, 0);
  for (const action of ['startNewGame', 'continueGame', 'resetProgress']) {
    saveStore.save({ version: 1, checkpointId: 'saved' });
    game.continueGame();
    assert.equal(replay.start('alpha'), null);
    game[action]();
    assert.equal(replay.activeNode, null, `${action} clears the in-memory session`);
  }

  // Exercise the actual PhoneUI with a minimal DOM adapter, without a browser or preview.
  const { PhoneUI } = await load('/src/ui/phone/PhoneUI.ts');
  class Element {
    children = []; dataset = {}; hidden = false; disabled = false;
    listeners = new Map(); textContent = '';
    constructor(tag = 'div') { this.tag = tag; }
    append(...children) { this.children.push(...children); }
    replaceChildren() { this.children = []; }
    setAttribute() {}
    addEventListener(type, handler) { this.listeners.set(type, handler); }
    removeEventListener(type) { this.listeners.delete(type); }
    closest() { return null; }
    contains(element) { return this === element || this.children.some((child) => child.contains(element)); }
    querySelectorAll() { return this.children.flatMap((child) => [
      ...(child.tag === 'button' ? [child] : []), ...child.querySelectorAll(),
    ]); }
    focus() { globalThis.document.activeElement = this; }
    click() { if (!this.disabled) this.listeners.get('click')?.(); }
  }
  class Button extends Element { constructor() { super('button'); } }
  const previousDocument = globalThis.document;
  const previousButton = globalThis.HTMLButtonElement;
  try {
    globalThis.document = { activeElement: null, createElement: (tag) => tag === 'button' ? new Button() : new Element(tag) };
    globalThis.HTMLButtonElement = Button;
    const screen = new Element();
    const root = new Element();
    const elements = new Map([
      ['.phone-shell', new Element()], ['[data-phone-back]', new Button()],
      ['[data-phone-close]', new Button()], ['[data-phone-title]', new Element()],
      ['[data-phone-screen]', screen],
    ]);
    root.querySelector = (selector) => elements.get(selector) ?? null;
    const phoneUi = new PhoneUI(root);
    const entries = [{ id: 'alpha', routeLabel: 'A', stageLabel: 'Arena', state: 'Cleared' }];
    let selected = null, cancelled = 0, confirmed = 0;
    phoneUi.renderMemories(entries, { activeLabel: null, error: null, onExit() {}, onReplay(id) { selected = id; } });
    phoneUi.focusDefault(); phoneUi.activateFocused();
    assert.equal(selected, 'alpha');
    assert.deepEqual(screen.querySelectorAll().map((button) => button.textContent), ['Replay A']);
    phoneUi.renderReplayConfirmation(entries[0], () => cancelled++, () => confirmed++);
    assert.equal(document.activeElement.textContent, 'Cancel');
    phoneUi.activateFocused(); assert.equal(cancelled, 1);
    phoneUi.moveFocus('down'); phoneUi.activateFocused(); assert.equal(confirmed, 1);
    phoneUi.renderExitReplayConfirmation(() => cancelled++, () => confirmed++);
    assert.equal(document.activeElement.textContent, 'Cancel');
    phoneUi.moveFocus('down'); phoneUi.activateFocused(); assert.equal(confirmed, 2);
    phoneUi.renderMemories(entries, { activeLabel: 'A · Arena', error: null, onExit() { confirmed++; }, onReplay() {} });
    assert.equal(screen.querySelectorAll().find((button) => button.textContent === 'Replay A').disabled, true);
    phoneUi.focusDefault();
    assert.equal(document.activeElement.textContent, 'Exit Replay');
    phoneUi.activateFocused(); assert.equal(confirmed, 3);
    phoneUi.dispose();
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousButton === undefined) delete globalThis.HTMLButtonElement;
    else globalThis.HTMLButtonElement = previousButton;
  }

  const gameSource = await read('../src/core/Game.ts');
  assert.match(gameSource, /this\.eventRunner\.update\(deltaSeconds\);\s*this\.replay\.update\(\)/);
  assert.match(gameSource, /replayTarget === null \? 'Replay is unavailable\.' : replayTarget\.start\(nodeId\)/);
  const uiSource = await read('../src/ui/phone/PhoneUI.ts');
  assert.match(uiSource, /Starting Replay leaves the current transient stage state/);
  assert.match(uiSource, /this\.screenElement\.append\(cancel, confirm\);\s*cancel\.focus\(\)/);
  assert.match(uiSource, /button\.disabled = replay\.activeLabel !== null/);
  const replaySource = await read('../src/replay/ReplayController.ts');
  assert.doesNotMatch(replaySource, /localStorage|campaign-|1-[1-5]|\.save\(|\.clear\(|\.reset\(|\.replace\(|completeNode|restoreForCheckpoint/);
  assert.equal(execFileSync('git', ['ls-files', 'public/private'], { encoding: 'utf8' }).trim(), '');
  phone.dispose(); runner.dispose(); game.dispose();
  console.log('Phase 23 browser-free validation passed.');
} finally { await server.close(); }
