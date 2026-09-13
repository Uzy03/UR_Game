import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Group, Mesh, MeshStandardMaterial, PerspectiveCamera, Vector3 } from 'three';
import { createServer } from 'vite';

await import('./validate-phase-18.mjs');

const server = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true, hmr: false },
});

class MemoryStorage {
  data = new Map();

  getItem(key) {
    return this.data.get(key) ?? null;
  }

  setItem(key, value) {
    this.data.set(key, String(value));
  }

  removeItem(key) {
    this.data.delete(key);
  }
}

class TestInput {
  movement = { x: 0, y: 0 };
  presses = new Set();

  getMovement() {
    return this.movement;
  }

  press(action) {
    this.presses.add(action);
  }

  consumeActionPress(action) {
    if (!this.presses.has(action)) return false;
    this.presses.delete(action);
    return true;
  }
}

const approximatelyEqual = (actual, expected, tolerance = 1e-6) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
};

const uiElement = () => ({ hidden: false, textContent: '' });

try {
  const loadModule = (path) => server.ssrLoadModule(path);
  const { createCampaignContent } = await loadModule(
    '/src/content/campaign/campaignContent.ts',
  );
  const { createCampaignSequences } = await loadModule(
    '/src/content/campaign/campaignSequences.ts',
  );
  const { createCampaignPhoneStory } = await loadModule(
    '/src/content/campaign/campaignPhoneStory.ts',
  );
  const { createCampaignTransitionCards } = await loadModule(
    '/src/content/campaign/campaignTransitionCards.ts',
  );
  const { FICTIONAL_CAMPAIGN_STORY } = await loadModule(
    '/src/content/campaign/fictionalCampaignStory.ts',
  );
  const campaignIds = await loadModule('/src/content/campaign/campaignIds.ts');
  const routeIds = await loadModule('/src/content/campaign/campaignWorldRoute.ts');
  const { InputAction } = await loadModule('/src/input/InputAction.ts');
  const { GAME_CONFIG } = await loadModule('/src/config/gameConfig.ts');
  const { GameSaveStore } = await loadModule('/src/save/GameSaveStore.ts');
  const { GameProgressController } = await loadModule(
    '/src/save/GameProgressController.ts',
  );
  const { WorldRoute } = await loadModule('/src/world/WorldRoute.ts');
  const { WorldProgress } = await loadModule('/src/world/WorldProgress.ts');
  const {
    WORLD_PROGRESS_STORAGE_KEY,
    WorldProgressStore,
  } = await loadModule('/src/world/WorldProgressStore.ts');
  const { WorldMapVehicle } = await loadModule('/src/world/WorldMapVehicle.ts');
  const { WorldMapController } = await loadModule('/src/world/WorldMapController.ts');

  const content = createCampaignContent(FICTIONAL_CAMPAIGN_STORY);
  const route = new WorldRoute(content.worldRoute);
  const expectedNodeIds = [
    routeIds.CAMPAIGN_ROUTE_MEETING_ID,
    routeIds.CAMPAIGN_ROUTE_OUTING_ID,
    routeIds.CAMPAIGN_ROUTE_PREPARATION_ID,
    routeIds.CAMPAIGN_ROUTE_JOURNEY_ID,
    routeIds.CAMPAIGN_ROUTE_ENDING_ID,
  ];
  const expectedLabels = ['1-1', '1-2', '1-3', '1-4', '1-5'];
  const expectedStageLabels = [
    'Cafe / Meeting',
    'Park / Outing',
    'Prep Space / Preparation',
    'Viewpoint / Journey',
    'Ending Room',
  ];
  const expectedCheckpoints = [
    campaignIds.CAMPAIGN_AFTER_MEETING_CHECKPOINT_ID,
    campaignIds.CAMPAIGN_AFTER_OUTING_CHECKPOINT_ID,
    campaignIds.CAMPAIGN_AFTER_PREPARATION_CHECKPOINT_ID,
    campaignIds.CAMPAIGN_BEFORE_ENDING_CHECKPOINT_ID,
    campaignIds.CAMPAIGN_COMPLETE_CHECKPOINT_ID,
  ];
  const expectedSceneIds = [
    campaignIds.CAMPAIGN_CAFE_SCENE_ID,
    campaignIds.CAMPAIGN_PARK_SCENE_ID,
    campaignIds.CAMPAIGN_PREP_SCENE_ID,
    campaignIds.CAMPAIGN_VIEWPOINT_SCENE_ID,
    campaignIds.CAMPAIGN_ENDING_SCENE_ID,
  ];

  assert.equal(route.nodes.length, 5);
  assert.deepEqual(route.nodeIds, expectedNodeIds);
  assert.deepEqual(route.nodes.map(({ label }) => label), expectedLabels);
  assert.deepEqual(route.nodes.map(({ stageLabel }) => stageLabel), expectedStageLabels);
  assert.equal(new Set(route.nodeIds).size, 5);
  assert.equal(new Set(route.nodes.map(({ stageLabel }) => stageLabel)).size, 5);
  for (const node of route.nodes) {
    assert.ok([node.position.x, node.position.y, node.position.z].every(Number.isFinite));
    assert.ok([node.vehicleSpawn.x, node.vehicleSpawn.y, node.vehicleSpawn.z].every(Number.isFinite));
    assert.ok(node.entrySequence.events.length > 0);
  }

  const sequences = createCampaignSequences(
    FICTIONAL_CAMPAIGN_STORY,
    createCampaignPhoneStory(FICTIONAL_CAMPAIGN_STORY),
    createCampaignTransitionCards(FICTIONAL_CAMPAIGN_STORY),
  );
  assert.equal(sequences.main.events.some((event) => event.type === 'change_scene'), false);
  assert.deepEqual(sequences.main.events.at(-1), { type: 'world_map', action: 'show' });

  const routeEntries = Object.values(sequences.routeEntries);
  assert.equal(routeEntries.length, 5);
  for (const [index, sequence] of routeEntries.entries()) {
    const checkpointIndex = sequence.events.findIndex(
      (event) => event.type === 'set_checkpoint',
    );
    const completionIndex = sequence.events.findIndex(
      (event) => event.type === 'world_map' && event.action === 'complete_node',
    );
    assert.ok(checkpointIndex >= 0);
    assert.equal(completionIndex, sequence.events.length - 1);
    assert.ok(checkpointIndex < completionIndex);
    assert.equal(sequence.events[checkpointIndex].checkpointId, expectedCheckpoints[index]);
    assert.equal(sequence.events[completionIndex].nodeId, expectedNodeIds[index]);
    assert.deepEqual(
      sequence.events.filter((event) => event.type === 'change_scene').map(({ sceneId }) => sceneId),
      [expectedSceneIds[index]],
    );
  }
  for (const resume of [
    sequences.afterMeeting,
    sequences.afterOuting,
    sequences.afterPreparation,
    sequences.beforeEnding,
    sequences.complete,
  ]) {
    assert.equal(resume.events.length, 1);
    assert.equal(resume.events[0].type, 'world_map');
    assert.equal(resume.events[0].action, 'show');
    assert.equal(typeof resume.events[0].bgmId, 'string');
  }

  const expectedPrefixes = [
    [],
    expectedNodeIds.slice(0, 1),
    expectedNodeIds.slice(0, 2),
    expectedNodeIds.slice(0, 3),
    expectedNodeIds.slice(0, 4),
    expectedNodeIds.slice(0, 5),
  ];
  const checkpointIds = [
    campaignIds.CAMPAIGN_INITIAL_CHECKPOINT_ID,
    ...expectedCheckpoints,
  ];
  for (const [index, checkpointId] of checkpointIds.entries()) {
    assert.deepEqual(route.getCompletedNodeIdsForCheckpoint(checkpointId), expectedPrefixes[index]);
    const spawn = route.getVehicleSpawn(expectedPrefixes[index]);
    const expectedSpawn = index === 0
      ? route.definition.initialVehicleSpawn
      : route.nodes[index - 1].vehicleSpawn;
    assert.deepEqual(spawn, expectedSpawn);
  }

  const progressStorage = new MemoryStorage();
  const progressStore = new WorldProgressStore(() => progressStorage);
  const progress = new WorldProgress(route, progressStore);
  assert.deepEqual(progress.completedNodeIds, []);
  assert.equal(progress.availableNode.id, expectedNodeIds[0]);
  assert.throws(() => progress.completeNode(expectedNodeIds[1]), /not currently available/);
  for (const [index, nodeId] of expectedNodeIds.entries()) {
    assert.equal(progress.getNodeState(nodeId), 'available');
    progress.completeNode(nodeId);
    assert.equal(progress.getNodeState(nodeId), 'completed');
    assert.deepEqual(progress.completedNodeIds, expectedNodeIds.slice(0, index + 1));
    assert.equal(progress.availableNode?.id ?? null, expectedNodeIds[index + 1] ?? null);
  }
  assert.equal(progress.availableNode, null);
  assert.deepEqual(JSON.parse(progressStorage.getItem(WORLD_PROGRESS_STORAGE_KEY)), {
    version: 1,
    completedNodeIds: expectedNodeIds,
  });
  progress.reset();
  assert.equal(progressStorage.getItem(WORLD_PROGRESS_STORAGE_KEY), null);

  for (const [index, checkpointId] of checkpointIds.entries()) {
    progress.restoreForCheckpoint(checkpointId);
    assert.deepEqual(progress.completedNodeIds, expectedPrefixes[index]);
  }

  const malformedCases = [
    { version: 2, completedNodeIds: [] },
    { version: 1, completedNodeIds: ['unknown'] },
    { version: 1, completedNodeIds: [expectedNodeIds[1]] },
    { version: 1, completedNodeIds: [expectedNodeIds[0], expectedNodeIds[0]] },
    { version: 1, completedNodeIds: expectedNodeIds.slice(0, 6).concat('extra') },
    { version: 1, completedNodeIds: [], vehiclePosition: { x: 1, z: 2 } },
  ];
  const originalWarn = console.warn;
  console.warn = () => undefined;
  try {
    for (const malformed of malformedCases) {
      const storage = new MemoryStorage();
      storage.setItem('ur-game:save:v1', '{"version":1,"checkpointId":"campaign-start"}');
      storage.setItem('ur-game:phone-progress:v1', '{"version":1}');
      storage.setItem(WORLD_PROGRESS_STORAGE_KEY, JSON.stringify(malformed));
      assert.equal(new WorldProgressStore(() => storage).load(route), null);
      assert.ok(storage.getItem('ur-game:save:v1') !== null);
      assert.ok(storage.getItem('ur-game:phone-progress:v1') !== null);
    }
  } finally {
    console.warn = originalWarn;
  }

  const gameStorage = new MemoryStorage();
  const gameSave = new GameSaveStore(() => gameStorage);
  gameSave.save({ version: 1, checkpointId: campaignIds.CAMPAIGN_AFTER_MEETING_CHECKPOINT_ID });
  assert.deepEqual(JSON.parse(gameStorage.getItem('ur-game:save:v1')), {
    version: 1,
    checkpointId: campaignIds.CAMPAIGN_AFTER_MEETING_CHECKPOINT_ID,
  });
  assert.equal(gameStorage.data.has(WORLD_PROGRESS_STORAGE_KEY), false);

  const vehicleResults = [];
  for (const movement of [{ x: 1, y: 0 }, { x: Math.SQRT1_2, y: Math.SQRT1_2 }]) {
    const vehicle = new WorldMapVehicle(GAME_CONFIG.worldMap.vehicle);
    vehicle.reset({ x: 0, y: 0, z: 0 });
    for (let frame = 0; frame < 30; frame += 1) {
      vehicle.update(1 / 60, movement);
    }
    vehicleResults.push(Math.hypot(vehicle.object.position.x, vehicle.object.position.z));
    assert.equal(Number.isFinite(vehicle.object.rotation.y), true);
    const wheels = [];
    let grayBodyParts = 0;
    let shadowCasters = 0;
    vehicle.object.traverse((object) => {
      if (object.name === 'WorldMapVehicleWheel') wheels.push(object);
      if (
        (object.name === 'WorldMapVehicleBody' || object.name === 'WorldMapVehicleCabin')
        && object instanceof Mesh
        && object.material instanceof MeshStandardMaterial
        && object.material.color.getHex() === 0x8d9298
      ) {
        grayBodyParts += 1;
      }
      if (object instanceof Mesh && object.castShadow) shadowCasters += 1;
    });
    assert.equal(wheels.length, 4);
    assert.equal(grayBodyParts, 2);
    assert.equal(shadowCasters, 2);
    vehicle.dispose();
  }
  approximatelyEqual(vehicleResults[0], vehicleResults[1]);

  const controllerStorage = new MemoryStorage();
  const controllerProgress = new WorldProgress(
    route,
    new WorldProgressStore(() => controllerStorage),
  );
  const controllerInput = new TestInput();
  const worldRoot = new Group();
  const camera = new PerspectiveCamera(34, 1, 0.1, 100);
  const prompt = uiElement();
  const hud = uiElement();
  const hudStatus = uiElement();
  const stageControls = uiElement();
  const mapControls = uiElement();
  let activateCount = 0;
  let deactivateCount = 0;
  let entryCount = 0;
  let inactiveAtEntry = false;
  let controller;
  controller = new WorldMapController({
    input: controllerInput,
    route,
    progress: controllerProgress,
    camera,
    worldRoot,
    promptElement: prompt,
    hudElement: hud,
    hudStatusElement: hudStatus,
    stageControlsElement: stageControls,
    mapControlsElement: mapControls,
    onActivate: () => { activateCount += 1; },
    onDeactivate: () => { deactivateCount += 1; },
    startEntrySequence: () => {
      entryCount += 1;
      inactiveAtEntry = !controller.isActive;
      return true;
    },
  }, {
    interactionRadius: GAME_CONFIG.worldMap.interactionRadius,
    vehicle: GAME_CONFIG.worldMap.vehicle,
    camera: {
      ...GAME_CONFIG.worldMap.camera,
      offset: new Vector3(
        GAME_CONFIG.worldMap.camera.offset.x,
        GAME_CONFIG.worldMap.camera.offset.y,
        GAME_CONFIG.worldMap.camera.offset.z,
      ),
      lookAtOffset: new Vector3(
        GAME_CONFIG.worldMap.camera.lookAtOffset.x,
        GAME_CONFIG.worldMap.camera.lookAtOffset.y,
        GAME_CONFIG.worldMap.camera.lookAtOffset.z,
      ),
    },
  });
  const inactivePosition = controller.vehicleObject.position.clone();
  controllerInput.movement = { x: 1, y: 0 };
  controller.update(1);
  assert.deepEqual(controller.vehicleObject.position.toArray(), inactivePosition.toArray());

  controller.showWorldMap();
  controller.commitPendingTransition();
  assert.equal(controller.isActive, true);
  assert.equal(activateCount, 1);
  assert.equal(stageControls.hidden, true);
  assert.equal(mapControls.hidden, false);
  assert.match(hudStatus.textContent, /Next 1-1/);
  assert.ok([camera.position.x, camera.position.y, camera.position.z].every(Number.isFinite));
  let worldMapShadowCasters = 0;
  worldRoot.traverse((object) => {
    if (object instanceof Mesh && object.castShadow) worldMapShadowCasters += 1;
  });
  assert.ok(worldMapShadowCasters <= 13);

  controller.vehicleObject.position.copy(route.nodes[1].position);
  controllerInput.press(InputAction.Interact);
  controller.update(0);
  assert.equal(entryCount, 0);
  assert.equal(controller.isActive, true);
  controllerInput.presses.delete(InputAction.Interact);

  controller.vehicleObject.position.copy(route.nodes[0].position);
  controllerInput.press(InputAction.Dash);
  controllerInput.press(InputAction.Throw);
  controller.update(0);
  assert.equal(entryCount, 0);
  assert.equal(controller.isActive, true);
  assert.equal(controllerInput.presses.has(InputAction.Dash), true);
  assert.equal(controllerInput.presses.has(InputAction.Throw), true);
  controllerInput.press(InputAction.Interact);
  controller.update(0);
  assert.equal(entryCount, 1);
  assert.equal(inactiveAtEntry, true);
  assert.equal(controller.isActive, false);
  assert.equal(deactivateCount, 1);

  controllerProgress.completeNode(expectedNodeIds[0]);
  controller.showWorldMap();
  controller.commitPendingTransition();
  assert.match(hudStatus.textContent, /Next 1-2/);
  controller.vehicleObject.position.copy(route.nodes[0].position);
  controllerInput.press(InputAction.Interact);
  controller.update(0);
  assert.equal(entryCount, 1);
  assert.equal(controller.isActive, true);
  controllerInput.presses.delete(InputAction.Interact);
  const childCount = worldRoot.children.length;
  controller.hide();
  controller.showWorldMap();
  controller.commitPendingTransition();
  assert.equal(worldRoot.children.length, childCount);
  controller.dispose();
  assert.equal(worldRoot.children.length, 0);

  const checkpointById = new Map(content.checkpoints.map((checkpoint) => [checkpoint.id, checkpoint]));
  const oldSaveStorage = new MemoryStorage();
  oldSaveStorage.setItem('ur-game:save:v1', JSON.stringify({
    version: 1,
    checkpointId: campaignIds.CAMPAIGN_AFTER_PREPARATION_CHECKPOINT_ID,
  }));
  const oldSaveStore = new GameSaveStore(() => oldSaveStorage);
  const migratedWorldProgress = new WorldProgress(
    route,
    new WorldProgressStore(() => oldSaveStorage),
  );
  let startedResume = null;
  let loadedSceneId = null;
  let replacedPhoneSnapshot = null;
  let resetHandler = null;
  const progressController = new GameProgressController({
    initialCheckpointId: content.initialCheckpointId,
    checkpoints: { getCheckpoint: (id) => checkpointById.get(id) },
    saveStore: oldSaveStore,
    sceneManager: { loadScene: (id) => { loadedSceneId = id; } },
    eventRunner: {
      state: 'idle',
      reset: () => undefined,
      start: (sequence) => { startedResume = sequence; return true; },
    },
    phoneProgress: {
      reset: () => undefined,
      replace: (snapshot) => { replacedPhoneSnapshot = snapshot; },
    },
    phone: { close: () => undefined },
    player: { setMovementEnabled: () => undefined },
    interaction: { reset: () => undefined, setEnabled: () => undefined },
    npcs: new Map(),
    menu: {
      setHandlers: (handlers) => { resetHandler = handlers.onResetProgress; },
      setBusy: () => undefined,
      hide: () => undefined,
      show: () => undefined,
      dispose: () => undefined,
    },
    focusTarget: { focus: () => undefined },
    worldMap: { hide: () => undefined },
    worldProgress: migratedWorldProgress,
  });
  progressController.continueGame();
  const prepCheckpoint = checkpointById.get(
    campaignIds.CAMPAIGN_AFTER_PREPARATION_CHECKPOINT_ID,
  );
  assert.equal(loadedSceneId, prepCheckpoint.sceneId);
  assert.equal(startedResume, prepCheckpoint.resumeSequence);
  assert.equal(replacedPhoneSnapshot, prepCheckpoint.phoneProgress);
  assert.deepEqual(migratedWorldProgress.completedNodeIds, expectedNodeIds.slice(0, 3));
  assert.deepEqual(JSON.parse(oldSaveStorage.getItem(WORLD_PROGRESS_STORAGE_KEY)), {
    version: 1,
    completedNodeIds: expectedNodeIds.slice(0, 3),
  });
  resetHandler();
  assert.equal(oldSaveStorage.getItem('ur-game:save:v1'), null);
  assert.equal(oldSaveStorage.getItem(WORLD_PROGRESS_STORAGE_KEY), null);
  progressController.dispose();

  const gameSaveTypes = await readFile(new URL('../src/save/GameSaveTypes.ts', import.meta.url), 'utf8');
  assert.match(gameSaveTypes, /readonly version: 1/);
  assert.match(gameSaveTypes, /readonly checkpointId: string/);
  assert.doesNotMatch(gameSaveTypes, /world|vehicle|camera/i);
  const phoneStore = await readFile(new URL('../src/phone/PhoneProgressStore.ts', import.meta.url), 'utf8');
  assert.match(phoneStore, /ur-game:phone-progress:v1/);
  const gameSource = await readFile(new URL('../src/core/Game.ts', import.meta.url), 'utf8');
  assert.match(gameSource, /if \(this\.worldMap\.isActive\)/);
  assert.match(gameSource, /this\.sceneManager\.unloadScene\(\)/);
  const worldSources = await Promise.all([
    'WorldMapController.ts',
    'WorldMapRuntime.ts',
    'WorldMapVehicle.ts',
  ].map((file) => readFile(new URL(`../src/world/${file}`, import.meta.url), 'utf8')));
  assert.doesNotMatch(worldSources.join('\n'), /RigidBody|Rapier|GLTF|license plate|manufacturer/i);

  console.log('Phase 19 browser-free validation passed.');
} finally {
  await server.close();
}
