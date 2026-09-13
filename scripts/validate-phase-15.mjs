import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

await import('./validate-phase-14.mjs');

const server = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true, hmr: false },
});

try {
  const loadModule = (path) => server.ssrLoadModule(path);
  const { parseCampaignStoryDefinition } =
    await loadModule('/src/content/campaign/CampaignStoryValidation.ts');
  const { loadCampaignStory } =
    await loadModule('/src/content/campaign/loadCampaignStory.ts');
  const { FICTIONAL_CAMPAIGN_STORY } =
    await loadModule('/src/content/campaign/fictionalCampaignStory.ts');
  const { createCampaignContent } =
    await loadModule('/src/content/campaign/campaignContent.ts');
  const { createCampaignScenes } =
    await loadModule('/src/content/campaign/campaignScenes.ts');
  const { createCampaignPhoneStory } =
    await loadModule('/src/content/campaign/campaignPhoneStory.ts');
  const { createCampaignTransitionCards } =
    await loadModule('/src/content/campaign/campaignTransitionCards.ts');
  const { createCampaignSequences } =
    await loadModule('/src/content/campaign/campaignSequences.ts');

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const example = JSON.parse(
    await readFile(new URL('../examples/campaign-story.example.json', import.meta.url), 'utf8'),
  );
  const privateStory = parseCampaignStoryDefinition(example, {
    photoPathPolicy: 'private-photos-only',
  });

  const privateResponse = {
    ok: true,
    status: 200,
    async json() { return example; },
  };
  const loadedPrivate = await loadCampaignStory(async () => privateResponse);
  assert.equal(loadedPrivate.companionDisplayName, 'Private Test Companion');

  const invalidNarrativeFields = [
    (story) => { story.companionDisplayName = ' '; },
    (story) => { story.prologue.checkPhoneObjectiveText = ''; },
    (story) => { story.meeting.placementTaskLabel = ''; },
    (story) => { story.outing.secondReachObjectiveText = ''; },
    (story) => { story.preparation.processingTaskLabel = ''; },
    (story) => { story.journey.assemblyObjectiveText = ''; },
  ];
  for (const invalidate of invalidNarrativeFields) {
    const candidate = clone(example);
    invalidate(candidate);
    assert.throws(() => parseCampaignStoryDefinition(candidate));
  }

  const validPrivatePaths = [
    '/private/photos/a.jpg',
    '/private/photos/subdir/a.webp',
  ];
  for (const src of validPrivatePaths) {
    const candidate = clone(example);
    candidate.meeting.photo.src = src;
    parseCampaignStoryDefinition(candidate, { photoPathPolicy: 'private-photos-only' });
  }

  const invalidPrivatePaths = [
    '/campaign/public.svg',
    'https://example.com/a.jpg',
    '//example.com/a.jpg',
    'data:image/png;base64,abc',
    'javascript:alert(1)',
    '/private/photos/../a.jpg',
    '/private/photos/%2e%2e/a.jpg',
    '/private/photos/%252e%252e/a.jpg',
    '/private/photos/subdir%2fa.jpg?download=1',
  ];
  for (const src of invalidPrivatePaths) {
    const candidate = clone(example);
    candidate.meeting.photo.src = src;
    assert.throws(
      () => parseCampaignStoryDefinition(candidate, {
        photoPathPolicy: 'private-photos-only',
      }),
      /story\.meeting\.photo\.src/,
    );
  }

  parseCampaignStoryDefinition(FICTIONAL_CAMPAIGN_STORY, {
    photoPathPolicy: 'repository-local',
  });
  assert.throws(
    () => parseCampaignStoryDefinition(FICTIONAL_CAMPAIGN_STORY, {
      photoPathPolicy: 'private-photos-only',
    }),
    /story\.meeting\.photo\.src/,
  );

  const publicScenes = createCampaignScenes(FICTIONAL_CAMPAIGN_STORY);
  const privateScenes = createCampaignScenes(privateStory);
  assert.deepEqual(
    publicScenes.map(({ id }) => id),
    privateScenes.map(({ id }) => id),
  );
  const privateNpcs = privateScenes.flatMap((scene) => scene.npcs);
  assert.ok(privateNpcs.length > 0);
  assert.ok(privateNpcs.every((npc) => npc.displayName === 'Private Test Companion'));

  const taskLabels = privateScenes.flatMap((scene) => [
    ...scene.placementTasks,
    ...(scene.reachTasks ?? []),
    ...(scene.processingTasks ?? []),
    ...(scene.assemblyTasks ?? []),
  ]).map(({ label }) => label);
  assert.deepEqual(new Set(taskLabels), new Set([
    privateStory.meeting.placementTaskLabel,
    privateStory.outing.firstReachTaskLabel,
    privateStory.outing.secondReachTaskLabel,
    privateStory.preparation.processingTaskLabel,
    privateStory.preparation.placementTaskLabel,
    privateStory.journey.assemblyTaskLabel,
    privateStory.journey.placementTaskLabel,
  ]));

  const withoutNarrative = (scenes) => JSON.parse(JSON.stringify(scenes), (key, value) => {
    if (key === 'displayName' || key === 'label') return '<story-text>';
    return value;
  });
  assert.deepEqual(withoutNarrative(publicScenes), withoutNarrative(privateScenes));

  const createSequences = (story) => createCampaignSequences(
    story,
    createCampaignPhoneStory(story),
    createCampaignTransitionCards(story),
  );
  const publicSequences = createSequences(FICTIONAL_CAMPAIGN_STORY);
  const privateSequences = createSequences(privateStory);
  const publicCampaignEvents = [
    ...publicSequences.main.events,
    ...Object.values(publicSequences.routeEntries).flatMap(({ events }) => events),
  ];
  const privateCampaignEvents = [
    ...privateSequences.main.events,
    ...Object.values(privateSequences.routeEntries).flatMap(({ events }) => events),
  ];
  assert.equal(publicCampaignEvents.length, 93);
  assert.equal(privateCampaignEvents.length, 93);
  const objectiveTexts = privateCampaignEvents
    .filter((event) => event.type === 'set_objective' && event.objective !== null)
    .map((event) => event.objective.text);
  assert.deepEqual(objectiveTexts, [
    privateStory.prologue.checkPhoneObjectiveText,
    privateStory.prologue.meetObjectiveText,
    privateStory.meeting.placementObjectiveText,
    privateStory.outing.firstReachObjectiveText,
    privateStory.outing.secondReachObjectiveText,
    privateStory.preparation.processingObjectiveText,
    privateStory.preparation.placementObjectiveText,
    privateStory.journey.assemblyObjectiveText,
    privateStory.journey.placementObjectiveText,
  ]);

  const publicContent = createCampaignContent(FICTIONAL_CAMPAIGN_STORY);
  const privateContent = createCampaignContent(privateStory);
  assert.deepEqual(publicContent.audioContent, privateContent.audioContent);
  assert.deepEqual(
    publicContent.checkpoints.map(({ id, sceneId }) => [id, sceneId]),
    privateContent.checkpoints.map(({ id, sceneId }) => [id, sceneId]),
  );
  assert.deepEqual(
    publicContent.phoneContent.messages.map(({ id }) => id),
    privateContent.phoneContent.messages.map(({ id }) => id),
  );
  assert.deepEqual(
    publicContent.phoneContent.photos.map(({ id }) => id),
    privateContent.phoneContent.photos.map(({ id }) => id),
  );

  const privateVisibleContent = JSON.stringify({
    scenes: privateScenes,
    sequences: privateSequences,
    phone: privateContent.phoneContent,
  });
  for (const placeholder of ['Demo Companion', 'Lantern Cafe', '2042']) {
    assert.equal(privateVisibleContent.includes(placeholder), false);
  }

  console.log('Phase 15 browser-free validation passed.');
} finally {
  await server.close();
}
