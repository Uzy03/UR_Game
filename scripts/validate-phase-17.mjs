import assert from 'node:assert/strict';
import { createServer } from 'vite';

await import('./validate-phase-16.mjs');

const server = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true, hmr: false },
});

try {
  const loadModule = (path) => server.ssrLoadModule(path);
  const { createCampaignContent } = await loadModule(
    '/src/content/campaign/campaignContent.ts',
  );
  const { createCampaignScenes } = await loadModule(
    '/src/content/campaign/campaignScenes.ts',
  );
  const { FICTIONAL_CAMPAIGN_STORY } = await loadModule(
    '/src/content/campaign/fictionalCampaignStory.ts',
  );
  const { SceneContentRegistry } = await loadModule(
    '/src/scene/SceneContentRegistry.ts',
  );
  const { createStageDecoration } = await loadModule(
    '/src/stage/createStageDecoration.ts',
  );

  const scenes = createCampaignScenes(FICTIONAL_CAMPAIGN_STORY);
  new SceneContentRegistry(scenes);
  const scenesById = new Map(scenes.map((scene) => [scene.id, scene]));

  assert.deepEqual(scenes.map(({ id }) => id), [
    'campaign-bedroom',
    'campaign-cafe',
    'campaign-cafe-complete',
    'campaign-park',
    'campaign-prep-space',
    'campaign-prep-space-complete',
    'campaign-viewpoint',
    'campaign-viewpoint-complete',
    'campaign-ending-room',
  ]);

  for (const sceneId of [
    'campaign-bedroom',
    'campaign-cafe',
    'campaign-park',
    'campaign-prep-space',
    'campaign-viewpoint',
    'campaign-ending-room',
  ]) {
    const scene = scenesById.get(sceneId);
    assert.ok(scene !== undefined);
    assert.ok(scene.stage.visualStyle !== undefined);
    assert.ok((scene.stage.decorations?.length ?? 0) > 0);
  }
  assert.deepEqual(
    Object.fromEntries([
      'campaign-bedroom',
      'campaign-cafe',
      'campaign-park',
      'campaign-prep-space',
      'campaign-viewpoint',
      'campaign-ending-room',
    ].map((sceneId) => [sceneId, scenesById.get(sceneId).stage.decorations.length])),
    {
      'campaign-bedroom': 7,
      'campaign-cafe': 10,
      'campaign-park': 9,
      'campaign-prep-space': 7,
      'campaign-viewpoint': 8,
      'campaign-ending-room': 10,
    },
  );

  for (const [baseId, completedId] of [
    ['campaign-cafe', 'campaign-cafe-complete'],
    ['campaign-prep-space', 'campaign-prep-space-complete'],
    ['campaign-viewpoint', 'campaign-viewpoint-complete'],
  ]) {
    const base = scenesById.get(baseId);
    const completed = scenesById.get(completedId);
    assert.ok(base !== undefined && completed !== undefined);
    assert.deepEqual(base.stage.visualStyle, completed.stage.visualStyle);
    assert.deepEqual(base.stage.decorations, completed.stage.decorations);
  }

  const decorationKinds = new Set(
    scenes.flatMap((scene) => scene.stage.decorations ?? []).map(({ kind }) => kind),
  );
  for (const requiredKind of [
    'bed',
    'bench',
    'tree',
    'flower-cluster',
    'rock',
    'lamp',
    'railing',
    'gift',
  ]) {
    assert.ok(decorationKinds.has(requiredKind), `Missing decoration kind: ${requiredKind}`);
  }

  for (const kind of [
    'bed',
    'bench',
    'chair',
    'flower-cluster',
    'gift',
    'lamp',
    'railing',
    'rock',
    'rug',
    'plant',
    'tree',
    'wall-art',
    'shelf',
    'table-setting',
    'pendant',
  ]) {
    const group = createStageDecoration({
      kind,
      position: { x: 0, y: 0, z: 0 },
      primaryColor: 0xffffff,
      secondaryColor: 0x777777,
    });
    assert.equal(group.name, `StageDecoration:${kind}`);
    assert.ok(group.children.length > 0);
  }

  for (const scene of scenes) {
    for (const decoration of scene.stage.decorations ?? []) {
      assert.ok(!('id' in decoration));
      assert.ok(!('taskId' in decoration));
      assert.ok(!('interact' in decoration));
      assert.ok(Math.abs(decoration.position.x) <= scene.stage.width / 2);
      assert.ok(Math.abs(decoration.position.z) <= scene.stage.depth / 2);
    }
  }

  const taskSignature = scenes.flatMap((scene) => [
    ...scene.placementTasks.map((task) => [
      task.id,
      task.durationSeconds,
      [...task.requiredItemIds],
      [...task.targetPlacePointIds],
    ]),
    ...(scene.reachTasks ?? []).map((task) => [task.id, null, task.radius]),
    ...(scene.processingTasks ?? []).map((task) => [
      task.id,
      task.durationSeconds,
      [...task.requiredItemIds],
      [...task.stationIds],
    ]),
    ...(scene.assemblyTasks ?? []).map((task) => [
      task.id,
      task.durationSeconds,
      [...task.stationIds],
    ]),
  ]);
  assert.deepEqual(taskSignature, [
    ['campaign-cafe-placement', 45, ['campaign-cafe-drink-a', 'campaign-cafe-drink-b'], ['campaign-cafe-place-a', 'campaign-cafe-place-b']],
    ['campaign-park-first-reach', null, 1.15],
    ['campaign-park-second-reach', null, 1.15],
    ['campaign-preparation-placement', 45, ['campaign-prep-fruit', 'campaign-prep-packet'], ['campaign-prep-place-a', 'campaign-prep-place-b']],
    ['campaign-preparation-processing', 55, ['campaign-prep-fruit', 'campaign-prep-packet'], ['campaign-processing-station']],
    ['campaign-viewpoint-placement', 45, ['campaign-assembly-output'], ['campaign-viewpoint-place']],
    ['campaign-viewpoint-assembly', 55, ['campaign-assembly-station']],
  ]);

  const itemIds = new Set(scenes.flatMap((scene) => scene.stage.items.map(({ id }) => id)));
  assert.deepEqual([...itemIds].sort(), [
    'campaign-assembly-input-a',
    'campaign-assembly-input-b',
    'campaign-assembly-output',
    'campaign-cafe-drink-a',
    'campaign-cafe-drink-b',
    'campaign-prep-fruit',
    'campaign-prep-packet',
  ]);
  const npcIds = new Set(scenes.flatMap((scene) => scene.npcs.map(({ id }) => id)));
  assert.deepEqual([...npcIds], ['campaign-demo-companion']);

  const content = createCampaignContent(FICTIONAL_CAMPAIGN_STORY);
  const campaignCheckpoints = content.checkpoints
    .filter(({ id }) => id.startsWith('campaign-'))
    .map(({ id, sceneId }) => [id, sceneId]);
  assert.deepEqual(campaignCheckpoints, [
    ['campaign-start', 'campaign-bedroom'],
    ['campaign-after-meeting', 'campaign-cafe-complete'],
    ['campaign-after-outing', 'campaign-park'],
    ['campaign-after-preparation', 'campaign-prep-space-complete'],
    ['campaign-before-ending', 'campaign-viewpoint-complete'],
    ['campaign-complete', 'campaign-ending-room'],
  ]);

  console.log('Phase 17 browser-free validation passed.');
} finally {
  await server.close();
}
