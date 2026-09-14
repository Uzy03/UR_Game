import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Group, Vector3 } from 'three';
import { createServer } from 'vite';

await import('./validate-phase-19.mjs');

const server = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true, hmr: false },
});

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

class TestCharacter {
  position = new Vector3(0, 0.9, 0);

  copyPositionTo(target) {
    target.copy(this.position);
  }

  move(displacement) {
    this.position.x += displacement.x;
    this.position.y += displacement.y;
    this.position.z += displacement.z;
  }

  resetPosition(position) {
    this.position.copy(position);
  }
}

const approximatelyEqual = (actual, expected, tolerance = 1e-6) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
};

try {
  const loadModule = (path) => server.ssrLoadModule(path);
  const { GAME_CONFIG } = await loadModule('/src/config/gameConfig.ts');
  const { InputAction } = await loadModule('/src/input/InputAction.ts');
  const { CarrySystem } = await loadModule('/src/interaction/CarrySystem.ts');
  const { PickableItem } = await loadModule('/src/interaction/PickableItem.ts');
  const { PlacePoint } = await loadModule('/src/interaction/PlacePoint.ts');
  const { ProcessingStation } = await loadModule('/src/interaction/ProcessingStation.ts');
  const { AssemblyStation } = await loadModule('/src/interaction/AssemblyStation.ts');
  const {
    ItemThrowSystem,
    sampleThrowTrajectory,
  } = await loadModule('/src/interaction/ItemThrowSystem.ts');
  const { THROW_RECEIVER_PRIORITY } = await loadModule(
    '/src/interaction/ThrowReceiver.ts',
  );
  const { DashBumpSystem } = await loadModule('/src/interaction/DashBumpSystem.ts');
  const { WorkMotionSystem } = await loadModule('/src/interaction/WorkMotionSystem.ts');
  const { PlacementTask } = await loadModule('/src/task/PlacementTask.ts');
  const { CountdownTimer } = await loadModule('/src/task/CountdownTimer.ts');
  const { PlayerController } = await loadModule('/src/player/PlayerController.ts');
  const { NPCController } = await loadModule('/src/npc/NPCController.ts');
  const { Stage } = await loadModule('/src/stage/Stage.ts');
  const { createCharacterVisual } = await loadModule('/src/visual/CharacterVisual.ts');

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
  assert.deepEqual(GAME_CONFIG.throwAssist, {
    endpointRadius: 1.05,
    blendStartProgress: 0.6,
    minimumForwardDot: 0.28,
    maximumLateralOffset: 1.1,
    npc: {
      assistRadius: 0.72,
      holdSeconds: 0.24,
      releaseDistance: 0.92,
    },
  });
  assert.deepEqual(GAME_CONFIG.dashBump, {
    combinedRadius: 0.84,
    npcVisualOffset: 0.4,
    recoverySeconds: 0.36,
  });
  assert.deepEqual(GAME_CONFIG.workMotion, {
    playerInteractionRadius: 1.7,
    playerMaximumSpeed: 0.4,
  });

  const throwOptions = {
    ...GAME_CONFIG.itemThrow,
    landingSpacing: GAME_CONFIG.interaction.floorItemSpacing,
    assist: {
      endpointRadius: GAME_CONFIG.throwAssist.endpointRadius,
      blendStartProgress: GAME_CONFIG.throwAssist.blendStartProgress,
      minimumForwardDot: GAME_CONFIG.throwAssist.minimumForwardDot,
      maximumLateralOffset: GAME_CONFIG.throwAssist.maximumLateralOffset,
    },
  };

  function createThrowFixture(itemDefinitions, validator = () => true) {
    const scene = new Group();
    const worldRoot = new Group();
    const playerObject = new Group();
    const carryAnchor = new Group();
    scene.add(worldRoot, playerObject);
    playerObject.add(carryAnchor);
    carryAnchor.position.set(0, 1.2, 0.45);
    const items = itemDefinitions.map((definition, index) => new PickableItem({
      id: definition.id,
      kind: definition.kind ?? (index % 2 === 0 ? 'tomato' : 'box'),
      position: definition.position ?? { x: -2 + index * 0.7, y: 0, z: -2 },
      parent: worldRoot,
      initialActive: definition.initialActive,
    }));
    const input = new TestInput();
    const player = {
      object: playerObject,
      isMovementEnabled: true,
      throwFeedbackCount: 0,
      triggerThrow() { this.throwFeedbackCount += 1; },
    };
    const carry = new CarrySystem(carryAnchor);
    carry.bindScene(worldRoot, items, validator);
    const itemThrow = new ItemThrowSystem(input, player, carry, throwOptions);
    const bindReceivers = (receivers) => itemThrow.bindScene(
      worldRoot,
      items,
      validator,
      receivers,
    );
    bindReceivers([]);
    return {
      scene,
      worldRoot,
      playerObject,
      items,
      input,
      player,
      carry,
      itemThrow,
      bindReceivers,
    };
  }

  function startThrow(fixture, item, movement = { x: 1, y: 0 }) {
    assert.equal(fixture.carry.pickUp(item), true);
    fixture.input.movement = movement;
    fixture.input.press(InputAction.Throw);
    fixture.itemThrow.update(0);
    assert.equal(fixture.player.throwFeedbackCount > 0, true);
  }

  function finishFlight(fixture, fps = 60) {
    const delta = 1 / fps;
    let guard = 0;
    while (fixture.itemThrow.activeThrowCount > 0 && guard < 300) {
      fixture.itemThrow.update(delta);
      guard += 1;
    }
    assert.equal(fixture.itemThrow.activeThrowCount, 0);
  }

  const start = new Vector3(0, 1.2, 0.45);
  const ordinaryEnd = new Vector3(3.6, 0, 0);
  const assistedEnd = new Vector3(3.25, 0.8, 0.4);
  const beforeAssist = sampleThrowTrajectory(
    start,
    ordinaryEnd,
    assistedEnd,
    0.5,
    GAME_CONFIG.itemThrow.arcHeight,
    GAME_CONFIG.throwAssist.blendStartProgress,
  );
  const ordinaryBeforeAssist = sampleThrowTrajectory(
    start,
    ordinaryEnd,
    ordinaryEnd,
    0.5,
    GAME_CONFIG.itemThrow.arcHeight,
    1,
  );
  assert.deepEqual(beforeAssist.toArray(), ordinaryBeforeAssist.toArray());
  for (const fps of [10, 15, 20, 30, 60, 120]) {
    const delta = 1 / fps;
    let progress = 0;
    while (progress < 1) {
      progress = Math.min(1, progress + delta / GAME_CONFIG.itemThrow.durationSeconds);
      const sample = sampleThrowTrajectory(
        start,
        ordinaryEnd,
        assistedEnd,
        progress,
        GAME_CONFIG.itemThrow.arcHeight,
        GAME_CONFIG.throwAssist.blendStartProgress,
      );
      assert.ok(sample.toArray().every(Number.isFinite));
      if (progress === 1) assert.deepEqual(sample.toArray(), assistedEnd.toArray());
    }
  }

  const floorFixture = createThrowFixture([{ id: 'floor-item' }]);
  startThrow(floorFixture, floorFixture.items[0]);
  finishFlight(floorFixture, 15);
  assert.equal(floorFixture.items[0].isOnFloor(), true);
  approximatelyEqual(floorFixture.items[0].object.position.x, 3.6);
  floorFixture.itemThrow.dispose();

  const placementFixture = createThrowFixture([
    { id: 'placement-item' },
    { id: 'reservation-item' },
  ]);
  const placePoint = new PlacePoint({
    id: 'throw-place-point',
    position: { x: 3.3, y: 0.7, z: 0 },
    parent: placementFixture.worldRoot,
  });
  placementFixture.bindReceivers([placePoint]);
  startThrow(placementFixture, placementFixture.items[0]);
  assert.equal(placementFixture.items[0].isThrown, true);
  assert.equal(placementFixture.items[0].canInteract({ carry: placementFixture.carry }), false);
  assert.equal(placePoint.canInteract({
    carry: { hasItem: true, item: placementFixture.items[1] },
  }), false);
  startThrow(placementFixture, placementFixture.items[1]);
  finishFlight(placementFixture);
  assert.equal(placePoint.currentItem, placementFixture.items[0]);
  assert.equal(placementFixture.items[0].object.parent, placePoint.object);
  assert.equal(placementFixture.items[1].isOnFloor(), true);
  const placementTask = new PlacementTask(new CountdownTimer(), {
    id: 'throw-placement-task',
    label: 'Throw placement task',
    requiredItemIds: ['placement-item'],
    targetPlacePoints: [placePoint],
    durationSeconds: 10,
  });
  placementTask.start();
  placementTask.update(0);
  assert.equal(placementTask.state, 'succeeded');

  const cleanupFixture = createThrowFixture([{ id: 'cleanup-item' }]);
  const cleanupPoint = new PlacePoint({
    id: 'cleanup-point',
    position: { x: 3.3, y: 0.7, z: 0 },
    parent: cleanupFixture.worldRoot,
  });
  cleanupFixture.bindReceivers([cleanupPoint]);
  startThrow(cleanupFixture, cleanupFixture.items[0]);
  cleanupFixture.itemThrow.cancelAll();
  assert.equal(cleanupFixture.items[0].isOnFloor(), true);
  startThrow(cleanupFixture, cleanupFixture.items[0]);
  finishFlight(cleanupFixture);
  assert.equal(cleanupPoint.currentItem, cleanupFixture.items[0]);
  cleanupFixture.itemThrow.dispose();

  const chosenIds = [];
  const deterministicFixture = createThrowFixture([{ id: 'deterministic-item' }]);
  const makeReceiver = (id, priority, position) => ({
    getThrowReceiverCandidate: () => ({
      id,
      priority,
      assistRadius: Number.POSITIVE_INFINITY,
      targetPosition: new Vector3(position.x, position.y, position.z),
      reserve: () => ({
        targetPosition: new Vector3(position.x, position.y, position.z),
        cancel: () => undefined,
        complete: (item, root) => {
          chosenIds.push(id);
          item.placeOnFloor(root, position);
          return null;
        },
      }),
    }),
  });
  deterministicFixture.bindReceivers([
    makeReceiver('receiver-b', THROW_RECEIVER_PRIORITY.station, { x: 3.4, y: 0, z: 0 }),
    makeReceiver('receiver-a', THROW_RECEIVER_PRIORITY.station, { x: 3.4, y: 0, z: 0 }),
    makeReceiver('receiver-table', THROW_RECEIVER_PRIORITY.table, { x: 3.6, y: 1, z: 0 }),
  ]);
  startThrow(deterministicFixture, deterministicFixture.items[0]);
  finishFlight(deterministicFixture);
  assert.deepEqual(chosenIds, ['receiver-a']);
  deterministicFixture.itemThrow.dispose();

  for (const target of [
    { x: 2.3, y: 0, z: 0 },
    { x: -0.4, y: 0, z: 0 },
    { x: 3.6, y: 0, z: 1.5 },
  ]) {
    const rejectedFixture = createThrowFixture([{ id: `rejected-${target.x}-${target.z}` }]);
    const selected = [];
    rejectedFixture.bindReceivers([{
      getThrowReceiverCandidate: () => ({
        id: 'rejected-receiver',
        priority: THROW_RECEIVER_PRIORITY.placePoint,
        assistRadius: Number.POSITIVE_INFINITY,
        targetPosition: new Vector3(target.x, target.y, target.z),
        reserve: () => ({
          targetPosition: new Vector3(target.x, target.y, target.z),
          cancel: () => undefined,
          complete: (item, root) => {
            selected.push(true);
            item.placeOnFloor(root, target);
            return null;
          },
        }),
      }),
    }]);
    startThrow(rejectedFixture, rejectedFixture.items[0]);
    finishFlight(rejectedFixture);
    assert.equal(selected.length, 0);
    approximatelyEqual(rejectedFixture.items[0].object.position.x, 3.6);
    rejectedFixture.itemThrow.dispose();
  }

  const processingFixture = createThrowFixture([
    { id: 'processable-item' },
    { id: 'wrong-processing-item' },
  ]);
  const processingStation = new ProcessingStation({
    id: 'processing-receiver',
    position: { x: 3.3, y: 0, z: 0 },
    processingDurationSeconds: 1.8,
    acceptedItemIds: ['processable-item'],
    parent: processingFixture.worldRoot,
  });
  processingStation.setProcessingEnabled(true);
  processingFixture.bindReceivers([processingStation]);
  startThrow(processingFixture, processingFixture.items[0]);
  finishFlight(processingFixture);
  assert.equal(processingStation.currentItem, processingFixture.items[0]);
  assert.equal(processingStation.state, 'loaded');
  assert.equal(processingStation.interact({ carry: processingFixture.carry }), true);
  assert.equal(processingStation.state, 'processing');
  const processingProgressBeforeMotion = processingStation.processingProgress;
  processingStation.updateVisual(0.1);
  assert.equal(processingStation.processingProgress, processingProgressBeforeMotion);
  assert.ok(processingFixture.items[0].object.position.length() > 0);
  processingStation.update(1.8);
  processingStation.updateVisual(0);
  assert.equal(processingStation.state, 'processed');
  assert.equal(processingFixture.items[0].isProcessed, true);
  assert.deepEqual(processingFixture.items[0].object.position.toArray(), [0, 0, 0]);

  const invalidProcessingFixture = createThrowFixture([{ id: 'not-accepted' }]);
  const invalidProcessingStation = new ProcessingStation({
    id: 'invalid-processing-receiver',
    position: { x: 3.3, y: 0, z: 0 },
    processingDurationSeconds: 1.8,
    acceptedItemIds: ['another-id'],
    parent: invalidProcessingFixture.worldRoot,
  });
  invalidProcessingStation.setProcessingEnabled(true);
  invalidProcessingFixture.bindReceivers([invalidProcessingStation]);
  startThrow(invalidProcessingFixture, invalidProcessingFixture.items[0]);
  finishFlight(invalidProcessingFixture);
  assert.equal(invalidProcessingStation.state, 'empty');
  assert.equal(invalidProcessingFixture.items[0].isOnFloor(), true);
  invalidProcessingStation.setProcessingEnabled(false);

  const disabledProcessingFixture = createThrowFixture([{ id: 'disabled-accepted' }]);
  const disabledProcessingStation = new ProcessingStation({
    id: 'disabled-processing-receiver',
    position: { x: 3.3, y: 0, z: 0 },
    processingDurationSeconds: 1.8,
    acceptedItemIds: ['disabled-accepted'],
    parent: disabledProcessingFixture.worldRoot,
  });
  disabledProcessingFixture.bindReceivers([disabledProcessingStation]);
  startThrow(disabledProcessingFixture, disabledProcessingFixture.items[0]);
  finishFlight(disabledProcessingFixture);
  assert.equal(disabledProcessingStation.state, 'empty');
  assert.equal(disabledProcessingFixture.items[0].isOnFloor(), true);

  const assemblyFixture = createThrowFixture([
    { id: 'assembly-a' },
    { id: 'assembly-b', kind: 'box' },
    { id: 'assembly-output', kind: 'bundle', initialActive: false },
    { id: 'assembly-wrong', kind: 'plate' },
  ]);
  const assemblyStation = new AssemblyStation({
    id: 'assembly-receiver',
    position: { x: 3.3, y: 0, z: 0 },
    inputItems: [assemblyFixture.items[0], assemblyFixture.items[1]],
    outputItem: assemblyFixture.items[2],
    combineDurationSeconds: 1.8,
    parent: assemblyFixture.worldRoot,
  });
  assemblyStation.setAssemblyEnabled(true);
  assemblyFixture.bindReceivers([assemblyStation]);
  startThrow(assemblyFixture, assemblyFixture.items[3]);
  finishFlight(assemblyFixture);
  assert.equal(assemblyStation.state, 'empty');
  for (const [index, expectedState] of [[0, 'one-loaded'], [1, 'ready']]) {
    startThrow(assemblyFixture, assemblyFixture.items[index]);
    finishFlight(assemblyFixture);
    assert.equal(assemblyStation.state, expectedState);
  }
  assert.equal(assemblyStation.interact({ carry: assemblyFixture.carry }), true);
  assert.equal(assemblyStation.state, 'combining');
  assemblyStation.updateVisual(0.1);
  assert.ok(assemblyFixture.items[0].object.position.length() > 0);
  let assemblyWorkMode = 'none';
  const assemblyWorkPlayer = {
    object: new Group(),
    currentSpeed: 0,
    isCarrying: false,
    setWorkMode: (mode) => { assemblyWorkMode = mode; },
  };
  assemblyFixture.scene.add(assemblyWorkPlayer.object);
  assemblyWorkPlayer.object.position.set(3.3, 0, 0);
  const assemblyWorkMotion = new WorkMotionSystem(
    assemblyWorkPlayer,
    [],
    [assemblyStation],
    GAME_CONFIG.workMotion,
  );
  assemblyWorkMotion.update(0.1);
  assert.equal(assemblyWorkMode, 'assembly');
  assemblyStation.update(1.8);
  assemblyStation.updateVisual(0);
  assert.equal(assemblyStation.state, 'completed');
  assert.equal(assemblyFixture.items[2].isActive, true);

  const physics = { createFixedBox: () => ({ dispose: () => undefined }) };
  const tableScene = new Group();
  const tableStage = new Stage(tableScene, physics, {
    width: 8,
    depth: 8,
    floorThickness: 0.4,
    wallThickness: 0.5,
    wallHeight: 1.5,
    floorColor: 0xffffff,
    wallColor: 0xffffff,
    obstacles: [{
      kind: 'table',
      position: { x: 3.5, y: 0.65, z: 0 },
      size: { x: 3.5, y: 1.3, z: 1.7 },
      color: 0xffffff,
    }],
    items: [
      { id: 'table-semantic-a', kind: 'drink', position: { x: -3, y: 0, z: -3 } },
      { id: 'table-semantic-b', kind: 'drink', position: { x: -2, y: 0, z: -3 } },
      { id: 'table-generic-item', kind: 'tomato', position: { x: -1, y: 0, z: -3 } },
    ],
    placePoints: [
      { id: 'table-place-a', position: { x: 3.05, y: 1.315, z: 0 } },
      { id: 'table-place-b', position: { x: 3.95, y: 1.315, z: 0 } },
    ],
  }, GAME_CONFIG.interaction.floorItemSpacing);
  const tablePlayer = new Group();
  const tableAnchor = new Group();
  tableScene.add(tablePlayer);
  tablePlayer.add(tableAnchor);
  tableAnchor.position.set(0, 1.2, 0.45);
  const tableInput = new TestInput();
  const tableCarry = new CarrySystem(tableAnchor);
  const tableValidator = (position, item, allItems) => tableStage.isFloorDropPositionValid(
    position,
    item,
    allItems,
    GAME_CONFIG.interaction.floorItemSpacing,
  );
  tableCarry.bindScene(tableStage.object, tableStage.pickableItems, tableValidator);
  const tableThrow = new ItemThrowSystem(
    tableInput,
    { object: tablePlayer, isMovementEnabled: true, triggerThrow: () => undefined },
    tableCarry,
    throwOptions,
  );
  tableThrow.bindScene(
    tableStage.object,
    tableStage.pickableItems,
    tableValidator,
    [...tableStage.placePoints, ...tableStage.tableThrowSurfaces],
  );
  // The ordinary floor endpoint stops in front of the obstacle, outside the global
  // endpoint radius of both canonical PlacePoints. Table geometry still routes the
  // clear table aim to distinct semantic anchors.
  assert.equal(tableCarry.pickUp(tableStage.pickableItems[0]), true);
  tableInput.movement = { x: 1, y: 0 };
  tableInput.press(InputAction.Throw);
  tableThrow.update(0);
  assert.equal(tableCarry.pickUp(tableStage.pickableItems[1]), true);
  tableInput.press(InputAction.Throw);
  tableThrow.update(0);
  while (tableThrow.activeThrowCount > 0) tableThrow.update(1 / 60);
  assert.equal(tableStage.placePoints[0].currentItem, tableStage.pickableItems[0]);
  assert.equal(tableStage.placePoints[1].currentItem, tableStage.pickableItems[1]);
  const tablePlacementTask = new PlacementTask(new CountdownTimer(), {
    id: 'table-throw-placement-task',
    label: 'Table throw placement task',
    requiredItemIds: ['table-semantic-a', 'table-semantic-b'],
    targetPlacePoints: tableStage.placePoints,
    durationSeconds: 10,
  });
  tablePlacementTask.start();
  tablePlacementTask.update(0);
  assert.equal(tablePlacementTask.state, 'succeeded');

  // With both contained semantic points occupied, the same table still provides
  // an ordinary pickup-able tabletop landing when a free surface position exists.
  assert.equal(tableCarry.pickUp(tableStage.pickableItems[2]), true);
  tableInput.press(InputAction.Throw);
  tableThrow.update(0);
  while (tableThrow.activeThrowCount > 0) tableThrow.update(1 / 60);
  const genericTableItem = tableStage.pickableItems[2];
  assert.equal(genericTableItem.isOnFloor(), true);
  approximatelyEqual(genericTableItem.object.position.y, 1.3);
  assert.ok(genericTableItem.object.position.x >= 2.04 && genericTableItem.object.position.x <= 4.96);
  assert.equal(tableCarry.pickUp(genericTableItem), true);
  tableThrow.dispose();
  tableStage.dispose();

  const npcFixture = createThrowFixture([{ id: 'npc-catch-item' }]);
  const npc = new NPCController({
    id: 'catch-npc',
    displayName: 'Catch NPC',
    position: { x: 3.35, y: 0.87, z: 0 },
    moveSpeed: 1.8,
    turnSharpness: 10,
    throwCatch: GAME_CONFIG.throwAssist.npc,
  });
  npc.object.rotation.y = Math.PI / 2;
  npcFixture.scene.add(npc.object);
  npcFixture.bindReceivers([npc]);
  const canonicalNpcPosition = npc.object.position.clone();
  startThrow(npcFixture, npcFixture.items[0]);
  finishFlight(npcFixture);
  assert.equal(npcFixture.itemThrow.activeReceiveCount, 1);
  assert.equal(npcFixture.items[0].object.parent, npc.catchAnchor);
  assert.equal(npcFixture.items[0].canInteract({ carry: npcFixture.carry }), false);
  npc.update(1 / 60);
  assert.deepEqual(npc.object.position.toArray(), canonicalNpcPosition.toArray());
  npcFixture.itemThrow.update(GAME_CONFIG.throwAssist.npc.holdSeconds);
  assert.equal(npcFixture.itemThrow.activeReceiveCount, 0);
  assert.equal(npcFixture.items[0].isOnFloor(), true);
  assert.equal(npcFixture.items[0].object.parent, npcFixture.worldRoot);
  assert.deepEqual(npc.object.position.toArray(), canonicalNpcPosition.toArray());
  startThrow(npcFixture, npcFixture.items[0]);
  finishFlight(npcFixture);
  assert.equal(npcFixture.itemThrow.activeReceiveCount, 1);
  npcFixture.itemThrow.cancelAll();
  assert.equal(npcFixture.itemThrow.activeReceiveCount, 0);
  assert.equal(npcFixture.items[0].isOnFloor(), true);

  const movingNpcFixture = createThrowFixture([{ id: 'moving-npc-item' }]);
  const movingNpc = new NPCController({
    id: 'moving-npc',
    displayName: 'Moving NPC',
    position: { x: 3.35, y: 0.87, z: 0 },
    moveSpeed: 1.8,
    turnSharpness: 10,
    throwCatch: GAME_CONFIG.throwAssist.npc,
  });
  movingNpc.object.rotation.y = Math.PI / 2;
  movingNpcFixture.scene.add(movingNpc.object);
  movingNpc.moveTo({ x: 4, y: 0.87, z: 0 });
  movingNpcFixture.bindReceivers([movingNpc]);
  startThrow(movingNpcFixture, movingNpcFixture.items[0]);
  finishFlight(movingNpcFixture);
  assert.equal(movingNpcFixture.itemThrow.activeReceiveCount, 0);
  assert.equal(movingNpcFixture.items[0].isOnFloor(), true);

  const unsafeNpcFixture = createThrowFixture(
    [{ id: 'unsafe-npc-item' }],
    ({ x, z }) => x <= 3.61 && Math.abs(z) < 0.1,
  );
  const unsafeNpc = new NPCController({
    id: 'unsafe-npc',
    displayName: 'Unsafe NPC',
    position: { x: 3.35, y: 0.87, z: 0 },
    moveSpeed: 1.8,
    turnSharpness: 10,
    throwCatch: GAME_CONFIG.throwAssist.npc,
  });
  unsafeNpc.object.rotation.y = Math.PI / 2;
  unsafeNpcFixture.scene.add(unsafeNpc.object);
  unsafeNpcFixture.bindReceivers([unsafeNpc]);
  startThrow(unsafeNpcFixture, unsafeNpcFixture.items[0]);
  finishFlight(unsafeNpcFixture);
  assert.equal(unsafeNpcFixture.itemThrow.activeReceiveCount, 0);
  approximatelyEqual(unsafeNpcFixture.items[0].object.position.x, 3.6);

  const dashNpc = new NPCController({
    id: 'dash-npc',
    displayName: 'Dash NPC',
    position: { x: 0.5, y: 0.87, z: 0 },
    moveSpeed: 1.8,
    turnSharpness: 10,
    throwCatch: GAME_CONFIG.throwAssist.npc,
  });
  const dashPlayer = {
    object: new Group(),
    dashFrameMotion: {
      active: false,
      sequenceId: 0,
      direction: { x: 1, z: 0 },
      start: { x: 0, z: 0 },
      end: { x: 0, z: 0 },
    },
    cancelCount: 0,
    cancelDashForBump() { this.cancelCount += 1; },
  };
  const dashNpcs = new Map([[dashNpc.id, dashNpc]]);
  const dashBump = new DashBumpSystem(dashPlayer, dashNpcs, GAME_CONFIG.dashBump);
  dashBump.updateAfterPlayerResolution();
  assert.equal(dashPlayer.cancelCount, 0);
  dashPlayer.dashFrameMotion = {
    active: true,
    sequenceId: 1,
    direction: { x: 1, z: 0 },
    start: { x: 0, z: 0 },
    end: { x: 1, z: 0 },
  };
  const dashNpcCanonical = dashNpc.object.position.clone();
  dashBump.updateAfterPlayerResolution();
  dashBump.updateAfterPlayerResolution();
  assert.equal(dashPlayer.cancelCount, 1);
  assert.deepEqual(dashNpc.object.position.toArray(), dashNpcCanonical.toArray());

  const sweptNpc = new NPCController({
    id: 'swept-dash-npc',
    displayName: 'Swept Dash NPC',
    position: { x: 1, y: 0.87, z: 0.5 },
    moveSpeed: 1.8,
    turnSharpness: 10,
    throwCatch: GAME_CONFIG.throwAssist.npc,
  });
  const sweptPlayer = {
    object: new Group(),
    dashFrameMotion: {
      active: true,
      sequenceId: 1,
      direction: { x: 1, z: 0 },
      start: { x: 0, z: 0 },
      end: { x: 2, z: 0 },
    },
    cancelCount: 0,
    cancelDashForBump() { this.cancelCount += 1; },
  };
  const sweptBump = new DashBumpSystem(
    sweptPlayer,
    new Map([[sweptNpc.id, sweptNpc]]),
    GAME_CONFIG.dashBump,
  );
  sweptBump.updateAfterPlayerResolution();
  assert.equal(sweptPlayer.cancelCount, 1);
  sweptNpc.update(0);
  assert.ok(sweptNpc.getPresentationOffset(new Vector3()).length() > 0);
  dashNpc.update(0);
  assert.ok(dashNpc.getPresentationOffset(new Vector3()).length() > 0);
  for (const fps of [10, 15, 20, 30, 60, 120]) {
    dashNpc.update(1 / fps);
  }
  for (let index = 0; index < 60; index += 1) dashNpc.update(1 / 120);
  approximatelyEqual(dashNpc.getPresentationOffset(new Vector3()).length(), 0);
  assert.deepEqual(dashNpc.object.position.toArray(), dashNpcCanonical.toArray());

  const realPlayerInput = new TestInput();
  const realCharacter = new TestCharacter();
  const realPlayer = new PlayerController(realPlayerInput, realCharacter, {
    speed: GAME_CONFIG.player.speed,
    acceleration: GAME_CONFIG.player.acceleration,
    deceleration: GAME_CONFIG.player.deceleration,
    turnSharpness: GAME_CONFIG.player.turnSharpness,
    groundProbeSpeed: GAME_CONFIG.physics.groundProbeSpeed,
    dash: GAME_CONFIG.player.dash,
  });
  const finalFrameNpc = new NPCController({
    id: 'final-frame-npc',
    displayName: 'Final Frame NPC',
    position: { x: 1.584, y: 0.87, z: 0 },
    moveSpeed: 1.8,
    turnSharpness: 10,
    throwCatch: GAME_CONFIG.throwAssist.npc,
  });
  const finalFrameSystem = new DashBumpSystem(
    realPlayer,
    new Map([[finalFrameNpc.id, finalFrameNpc]]),
    GAME_CONFIG.dashBump,
  );
  realPlayerInput.movement = { x: 1, y: 0 };
  realPlayerInput.press(InputAction.Dash);
  realPlayer.updateBeforePhysics(GAME_CONFIG.player.dash.durationSeconds);
  realPlayer.updateAfterPhysics(GAME_CONFIG.player.dash.durationSeconds);
  assert.equal(realPlayer.isDashing, false);
  assert.equal(realPlayer.dashFrameMotion.active, true);
  finalFrameSystem.updateAfterPlayerResolution();
  finalFrameNpc.update(0);
  assert.ok(finalFrameNpc.getPresentationOffset(new Vector3()).length() > 0);

  const workItemFixture = createThrowFixture([{ id: 'work-item' }]);
  const workProcessing = new ProcessingStation({
    id: 'work-processing',
    position: { x: 0.5, y: 0, z: 0 },
    processingDurationSeconds: 1.8,
    acceptedItemIds: ['work-item'],
    parent: workItemFixture.worldRoot,
  });
  workProcessing.setProcessingEnabled(true);
  assert.equal(workItemFixture.carry.pickUp(workItemFixture.items[0]), true);
  assert.equal(workProcessing.interact({ carry: workItemFixture.carry }), true);
  assert.equal(workProcessing.interact({ carry: workItemFixture.carry }), true);
  let workMode = 'none';
  const workPlayer = {
    object: workItemFixture.playerObject,
    currentSpeed: 0,
    isCarrying: false,
    setWorkMode: (mode) => { workMode = mode; },
  };
  const processingWorkMotion = new WorkMotionSystem(
    workPlayer,
    [workProcessing],
    [],
    GAME_CONFIG.workMotion,
  );
  processingWorkMotion.update(0.1);
  assert.equal(workMode, 'processing');
  workProcessing.updateVisual(0.1);
  const stationVisualPosition = workItemFixture.items[0].object.position.clone();
  processingWorkMotion.update(0.1);
  assert.deepEqual(
    workItemFixture.items[0].object.position.toArray(),
    stationVisualPosition.toArray(),
  );
  const progressBeforeWalking = workProcessing.processingProgress;
  workPlayer.currentSpeed = 1;
  processingWorkMotion.update(0.1);
  assert.equal(workMode, 'none');
  assert.equal(workProcessing.processingProgress, progressBeforeWalking);
  processingWorkMotion.reset();
  assert.deepEqual(workItemFixture.items[0].object.position.toArray(), [0, 0, 0]);

  const visual = createCharacterVisual('WorkMotionTest', {
    bodyColor: 0xffffff,
    secondaryColor: 0x777777,
    skinColor: 0xffccaa,
    hairColor: 0x333333,
    silhouette: 'scarf',
  });
  visual.animator.setWorkMode('processing');
  for (let index = 0; index < 30; index += 1) {
    visual.animator.update(1 / 60, { actualSpeed: 0, maximumSpeed: 4.4, carrying: false });
  }
  const processingArmPose = visual.root.getObjectByName('LeftArmRig').rotation.clone();
  visual.animator.reset();
  visual.animator.setWorkMode('assembly');
  for (let index = 0; index < 30; index += 1) {
    visual.animator.update(1 / 60, { actualSpeed: 0, maximumSpeed: 4.4, carrying: false });
  }
  const assemblyArmPose = visual.root.getObjectByName('LeftArmRig').rotation.clone();
  assert.notDeepEqual(processingArmPose.toArray(), assemblyArmPose.toArray());
  const workLean = Math.abs(visual.root.getObjectByName('CharacterVisual').rotation.x);
  for (let index = 0; index < 30; index += 1) {
    visual.animator.update(1 / 60, { actualSpeed: 4.4, maximumSpeed: 4.4, carrying: false });
  }
  assert.ok(Math.abs(visual.root.getObjectByName('CharacterVisual').rotation.x) < workLean);
  for (const fps of [10, 15, 20, 30, 60, 120]) {
    visual.animator.update(1 / fps, { actualSpeed: 0, maximumSpeed: 4.4, carrying: false });
    visual.root.traverse((object) => {
      assert.ok([
        ...object.position.toArray(),
        ...object.rotation.toArray().slice(0, 3),
        ...object.scale.toArray(),
      ].every(Number.isFinite));
    });
  }
  visual.animator.reset();
  approximatelyEqual(
    visual.animator.getPresentationOffset(new Vector3()).length(),
    0,
  );

  for (const disposable of [
    placementFixture.itemThrow,
    processingFixture.itemThrow,
    invalidProcessingFixture.itemThrow,
    disabledProcessingFixture.itemThrow,
    assemblyFixture.itemThrow,
    npcFixture.itemThrow,
    movingNpcFixture.itemThrow,
    unsafeNpcFixture.itemThrow,
  ]) disposable.dispose();
  for (const disposableNpc of [
    npc,
    movingNpc,
    unsafeNpc,
    dashNpc,
    sweptNpc,
    finalFrameNpc,
  ]) disposableNpc.dispose();
  realPlayer.dispose();

  const eventTypesSource = await readFile(
    new URL('../src/events/EventTypes.ts', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(eventTypesSource, /throw_assist|dash_bump|work_motion/i);
  const taskSource = await readFile(new URL('../src/task/Task.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(taskSource, /processing_motion|assembly_motion|bump/i);
  const interactionSource = await readFile(
    new URL('../src/interaction/InteractionSystem.ts', import.meta.url),
    'utf8',
  );
  const workMotionSource = await readFile(
    new URL('../src/interaction/WorkMotionSystem.ts', import.meta.url),
    'utf8',
  );
  assert.match(interactionSource, /interactable\.updateVisual\?\.\(deltaSeconds\)/);
  assert.doesNotMatch(workMotionSource, /station\.updateVisual\(/);
  const campaignScenesSource = await readFile(
    new URL('../src/content/campaign/campaignScenes.ts', import.meta.url),
    'utf8',
  );
  assert.match(campaignScenesSource, /processingDurationSeconds: 1\.8/);
  assert.match(campaignScenesSource, /combineDurationSeconds: 1\.8/);
  const gameSource = await readFile(new URL('../src/core/Game.ts', import.meta.url), 'utf8');
  const mapBranchIndex = gameSource.indexOf('if (this.worldMap.isActive)');
  const stageBranchIndex = gameSource.indexOf('else if (this.sceneManager.currentSceneId !== null)');
  const bumpIndex = gameSource.indexOf('this.dashBump.updateAfterPlayerResolution()');
  assert.ok(mapBranchIndex >= 0 && stageBranchIndex > mapBranchIndex && bumpIndex > stageBranchIndex);
  assert.doesNotMatch(gameSource.slice(mapBranchIndex, stageBranchIndex), /itemThrow|dashBump/);

  console.log('Phase 20 browser-free validation passed.');
} finally {
  await server.close();
}
