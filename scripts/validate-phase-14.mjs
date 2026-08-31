import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

const server = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true, hmr: false },
});

try {
  const loadModule = (path) => server.ssrLoadModule(path);
  const { loadCampaignStory, PRIVATE_CAMPAIGN_STORY_PATH } =
    await loadModule('/src/content/campaign/loadCampaignStory.ts');
  const { FICTIONAL_CAMPAIGN_STORY } =
    await loadModule('/src/content/campaign/fictionalCampaignStory.ts');
  const { parseCampaignStoryDefinition } =
    await loadModule('/src/content/campaign/CampaignStoryValidation.ts');
  const { createCampaignContent } =
    await loadModule('/src/content/campaign/campaignContent.ts');
  const { createCampaignPhoneContent } =
    await loadModule('/src/content/campaign/campaignPhoneContent.ts');
  const { createCampaignPhoneStory } =
    await loadModule('/src/content/campaign/campaignPhoneStory.ts');
  const { createCampaignTransitionCards } =
    await loadModule('/src/content/campaign/campaignTransitionCards.ts');
  const { createCampaignSequences } =
    await loadModule('/src/content/campaign/campaignSequences.ts');
  const { SceneContentRegistry } = await loadModule('/src/scene/SceneContentRegistry.ts');
  const { PhoneContentRegistry } = await loadModule('/src/phone/PhoneContentRegistry.ts');
  const { AudioContentRegistry } = await loadModule('/src/audio/AudioContentRegistry.ts');
  const { CheckpointRegistry } = await loadModule('/src/save/CheckpointRegistry.ts');

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const response = (status, value) => ({
    ok: status >= 200 && status < 300,
    status,
    async json() {
      if (value instanceof Error) throw value;
      return value;
    },
  });

  let requestedPath = '';
  let requestedAccept = '';
  const fallback = await loadCampaignStory(async (path, request) => {
    requestedPath = path;
    requestedAccept = request.headers.Accept;
    return response(404);
  });
  assert.equal(requestedPath, PRIVATE_CAMPAIGN_STORY_PATH);
  assert.equal(requestedAccept, 'application/json');
  assert.equal(fallback, FICTIONAL_CAMPAIGN_STORY);
  await assert.rejects(loadCampaignStory(async () => response(403)), /status 403/);
  await assert.rejects(
    loadCampaignStory(async () => response(200, new SyntaxError('invalid JSON'))),
    /malformed JSON/,
  );

  const privateStory = clone(FICTIONAL_CAMPAIGN_STORY);
  privateStory.phoneThreadTitle = 'LOCAL PRIVATE TEST THREAD';
  privateStory.meeting.date = '2098-10-01';
  privateStory.meeting.dialogueIntro[0].text = 'LOCAL PRIVATE TEST DIALOGUE';
  privateStory.meeting.photo.src = '/private/photos/test-memory.jpg';
  const loadedPrivate = await loadCampaignStory(async () => response(200, privateStory));
  assert.equal(loadedPrivate.phoneThreadTitle, 'LOCAL PRIVATE TEST THREAD');

  const invalidStories = [
    null,
    { ...clone(privateStory), phoneThreadTitle: '   ' },
    { ...clone(privateStory), meeting: { ...privateStory.meeting, date: '2098-02-30' } },
    { ...clone(privateStory), outing: { ...privateStory.outing, dialogueIntro: [] } },
    {
      ...clone(privateStory),
      meeting: {
        ...privateStory.meeting,
        photo: { ...privateStory.meeting.photo, src: 'https://example.com/photo.jpg' },
      },
    },
    {
      ...clone(privateStory),
      meeting: {
        ...privateStory.meeting,
        photo: { ...privateStory.meeting.photo, src: '/private/../photo.jpg' },
      },
    },
  ];
  for (const invalid of invalidStories) {
    assert.throws(() => parseCampaignStoryDefinition(invalid));
    await assert.rejects(
      loadCampaignStory(async () => response(200, invalid)),
      /Private Campaign Story is invalid/,
    );
  }

  const example = JSON.parse(
    await readFile(new URL('../examples/campaign-story.example.json', import.meta.url), 'utf8'),
  );
  parseCampaignStoryDefinition(example);

  const createSequences = (story) => createCampaignSequences(
    story,
    createCampaignPhoneStory(story),
    createCampaignTransitionCards(story),
  );
  const publicSequences = createSequences(FICTIONAL_CAMPAIGN_STORY);
  const privateSequences = createSequences(loadedPrivate);
  assert.deepEqual(publicSequences.segmentEventCounts, {
    prologue: 10,
    meeting: 9,
    outing: 18,
    preparation: 17,
    journey: 16,
    ending: 16,
  });
  assert.equal(publicSequences.main.events.length, 86);
  assert.equal(
    publicSequences.main.events.filter((event) => event.type === 'audio_cue').length,
    16,
  );

  const mechanicalSignature = (event) => {
    switch (event.type) {
      case 'dialogue': return [event.type, event.sequence.id];
      case 'phone_story': return [event.type, event.card.id];
      case 'transition_card': return [event.type, event.card.id, event.card.durationSeconds];
      case 'speech': return [event.type, event.npcId, event.durationSeconds];
      case 'set_date': return [event.type];
      case 'set_objective': return [event.type, event.objective?.id ?? null];
      case 'audio_cue': return [event.type, event.cue.kind, event.cue.audioId];
      case 'move_npc': return [event.type, event.npcId, event.position];
      case 'task': return [event.type, event.taskId];
      case 'unlock_message': return [event.type, event.messageId];
      case 'unlock_photo': return [event.type, event.photoId];
      case 'change_scene': return [event.type, event.sceneId];
      case 'set_checkpoint': return [event.type, event.checkpointId];
      case 'wait': return [event.type, event.durationSeconds];
      default: throw new Error(`Unexpected event type ${event.type}`);
    }
  };
  assert.deepEqual(
    publicSequences.main.events.map(mechanicalSignature),
    privateSequences.main.events.map(mechanicalSignature),
  );

  let suffixStart = 0;
  const suffixes = [
    ['prologue', null],
    ['meeting', publicSequences.afterMeeting],
    ['outing', publicSequences.afterOuting],
    ['preparation', publicSequences.afterPreparation],
    ['journey', publicSequences.beforeEnding],
  ];
  for (const [segment, suffix] of suffixes) {
    suffixStart += publicSequences.segmentEventCounts[segment];
    if (suffix !== null) {
      assert.deepEqual(suffix.events, publicSequences.main.events.slice(suffixStart));
    }
  }

  const publicPhone = createCampaignPhoneContent(FICTIONAL_CAMPAIGN_STORY);
  const privatePhone = createCampaignPhoneContent(loadedPrivate);
  assert.deepEqual(
    publicPhone.messages.map(({ id }) => id),
    privatePhone.messages.map(({ id }) => id),
  );
  assert.deepEqual(
    publicPhone.photos.map(({ id }) => id),
    privatePhone.photos.map(({ id }) => id),
  );
  assert.equal(privatePhone.photos[0].src, '/private/photos/test-memory.jpg');

  const publicContent = createCampaignContent(FICTIONAL_CAMPAIGN_STORY);
  const privateContent = createCampaignContent(loadedPrivate);
  assert.equal(publicContent.checkpoints.length, 16);
  assert.deepEqual(
    publicContent.checkpoints.map(({ id, sceneId }) => [id, sceneId]),
    privateContent.checkpoints.map(({ id, sceneId }) => [id, sceneId]),
  );
  assert.deepEqual(publicContent.audioContent, privateContent.audioContent);

  const scenes = new SceneContentRegistry(privateContent.scenes);
  const phone = new PhoneContentRegistry(privateContent.phoneContent);
  const audio = new AudioContentRegistry(privateContent.audioContent);
  const checkpoints = new CheckpointRegistry(
    privateContent.checkpoints,
    scenes,
    phone,
    audio,
  );
  assert.ok(checkpoints.getCheckpoint(privateContent.initialCheckpointId));

  console.log('Phase 14 browser-free validation passed.');
} finally {
  await server.close();
}
