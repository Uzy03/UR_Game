import assert from 'node:assert/strict';
import { createServer } from 'vite';

await import('./validate-phase-15.mjs');

const server = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true, hmr: false },
});

try {
  const loadModule = (path) => server.ssrLoadModule(path);
  const { stepPlanarVelocity } = await loadModule('/src/player/MovementSmoothing.ts');
  const { sampleCharacterPose } = await loadModule('/src/visual/CharacterAnimator.ts');
  const { createCampaignScenes } = await loadModule('/src/content/campaign/campaignScenes.ts');
  const { FICTIONAL_CAMPAIGN_STORY } = await loadModule(
    '/src/content/campaign/fictionalCampaignStory.ts',
  );
  const { SceneContentRegistry } = await loadModule('/src/scene/SceneContentRegistry.ts');

  const velocity = { x: 0, z: 0 };
  for (let frame = 0; frame < 60; frame += 1) {
    stepPlanarVelocity(velocity, { x: 1, z: 0 }, 4.4, 20, 26, 1 / 60);
  }
  assert.ok(Math.abs(velocity.x - 4.4) < 0.0001);
  assert.equal(velocity.z, 0);

  const diagonal = { x: 0, z: 0 };
  for (let frame = 0; frame < 60; frame += 1) {
    stepPlanarVelocity(diagonal, { x: 1, z: 1 }, 4.4, 20, 26, 1 / 60);
  }
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.z) - 4.4) < 0.0001);

  for (let frame = 0; frame < 30; frame += 1) {
    stepPlanarVelocity(velocity, { x: 0, z: 0 }, 4.4, 20, 26, 1 / 60);
  }
  assert.ok(Math.hypot(velocity.x, velocity.z) < 0.0001);

  const simulate = (stepSeconds) => {
    const value = { x: 0, z: 0 };
    let position = 0;
    const frameCount = Math.round(1 / stepSeconds);
    for (let frame = 0; frame < frameCount; frame += 1) {
      stepPlanarVelocity(value, { x: 0, z: 1 }, 4.4, 20, 26, stepSeconds);
      position += value.z * stepSeconds;
    }
    return { position, speed: value.z };
  };
  const sixtyFps = simulate(1 / 60);
  const oneTwentyFps = simulate(1 / 120);
  assert.ok(Math.abs(sixtyFps.speed - oneTwentyFps.speed) < 0.0001);
  assert.ok(Math.abs(sixtyFps.position - oneTwentyFps.position) < 0.025);

  for (const movementAmount of [-2, 0, 0.5, 1, 4]) {
    const pose = sampleCharacterPose(1.25, 2.5, movementAmount);
    assert.ok(Object.values(pose).every(Number.isFinite));
    assert.ok(pose.movementAmount >= 0 && pose.movementAmount <= 1);
    assert.ok(Math.abs(pose.limbSwing) <= 0.58);
  }

  const scenes = createCampaignScenes(FICTIONAL_CAMPAIGN_STORY);
  new SceneContentRegistry(scenes);
  const cafe = scenes.find((scene) => scene.id === 'campaign-cafe');
  const cafeComplete = scenes.find((scene) => scene.id === 'campaign-cafe-complete');
  assert.ok(cafe !== undefined);
  assert.ok(cafeComplete !== undefined);
  assert.equal(cafe.stage.decorations?.length, 10);
  assert.deepEqual(cafe.stage.visualStyle, cafeComplete.stage.visualStyle);
  assert.deepEqual(cafe.stage.decorations, cafeComplete.stage.decorations);
  assert.deepEqual(
    cafe.placementTasks.map(({ id, durationSeconds }) => [id, durationSeconds]),
    [['campaign-cafe-placement', 45]],
  );

  console.log('Phase 16 browser-free validation passed.');
} finally {
  await server.close();
}
