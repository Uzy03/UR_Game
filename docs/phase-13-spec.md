# UR_Game Phase 13 — Audio & Atmosphere Foundation

## Baseline

- Phase 12 branch: `codex/phase-12-presentation`
- Phase 12 commit: `8e89c7a2a14f731c28b8de5b6b7a3a4ddf6ca6ab`
- Phase 13 branch: `codex/phase-13-audio`
- Package version: `0.13.0`

## Purpose

Phase 13 adds replaceable BGM, short SFX, crossfade, autoplay recovery, and session-only Mute to the fictional Campaign. It does not add gameplay or real anniversary content.

## Architecture

```text
AudioContentRegistry
  Audio ID → validated static definition

AudioManager
  desired BGM
  BGM channels / crossfade
  SFX one-shot playbacks
  autoplay unlock / pending BGM
  session-only mute / dispose

BrowserAudioMediaFactory
  local fetch / decode cache
  shared Web Audio Context
  sample-accurate loop / one-shot source

EventRunner
  audio_cue → AudioActions → immediate completion

Campaign content
  explicit cue placement
```

`EventRunner` does not know browser audio APIs. `AudioManager` receives a small injectable media factory, allowing its state behavior to be tested without browser Audio. `BrowserAudioMediaFactory` implements that boundary with one shared Web Audio Context and decoded buffer cache. Fade progression is updated from the main game loop and remains independent of EventRunner lifetime.

Looping BGM uses `AudioBufferSourceNode.loop`, avoiding the audible scheduling gap that short `HTMLAudioElement` loops can introduce. SFX uses the same context as one-shot sources, while lifecycle and cue semantics remain owned by `AudioManager`.

`SceneManager`, `SceneDefinition`, Task systems, `TransitionOverlay`, and `PhoneController` have no Audio dependency.

## Audio content

`AudioClipDefinition` contains:

- non-empty ID
- repository-local source
- `bgm` or `sfx` kind
- volume from 0 to 1
- optional loop flag

`AudioContentRegistry` rejects duplicate IDs, invalid kinds, invalid volumes, empty sources, and invalid loop values.

The Campaign defines:

| ID | Kind | Usage |
| --- | --- | --- |
| `campaign-main-bgm` | BGM | Prologue through Journey |
| `campaign-ending-bgm` | BGM | Ending and completed Continue |
| `campaign-transition-sfx` | SFX | Five Transition Cards |
| `campaign-memory-sfx` | SFX | Selected Message/Photo unlocks |
| `campaign-ending-chime-sfx` | SFX | Final Ending beat |

Main and Ending BGM are looping. Reissuing the same BGM ID does not restart it. Switching IDs allows at most the current and outgoing channel to overlap during a linear crossfade.

## Audio event

`audio_cue` is the only new GameEvent. Its cue is one of:

```text
play_bgm(audioId, optional fadeSeconds)
stop_bgm(optional fadeSeconds)
play_sfx(audioId)
```

It is immediate and never waits for playback completion. Checkpoint registration validates referenced IDs, clip kinds, and finite non-negative fade durations through the static `AudioContentRegistry`.

Audio cues live in the canonical Campaign segment arrays. Every resumable suffix starts with an appropriate Main or Ending BGM cue. The completed resume sequence explicitly restores Ending BGM because it is the existing non-suffix completed-state exception.

## Autoplay and Mute

Before a browser gesture, `playBgm` stores the desired BGM without failing. One-shot `pointerdown` and `keydown` listeners unlock playback and start the pending request. A rejected `play()` promise is handled without propagating an EventRunner or game error; the desired BGM remains and unlock listeners are rearmed.

The HTML Mute button does not add an InputAction. Mute is session-only and affects BGM and SFX without changing Game Save, Phone Progress, or audio playback position.

## Placeholder asset provenance

All files in `public/audio/` are original, programmatically generated fictional placeholders created by `scripts/generate-placeholder-audio.mjs` specifically for this repository. They contain only synthesized waveforms and use no external recording, composition, model output, CDN, or third-party asset.

The generator produces mono 22,050 Hz, 16-bit PCM WAV files:

- two 8-second seamless ambient loops
- one 0.85-second transition sound
- one 0.9-second memory sound
- one 1.7-second ending chime

## Save and privacy

Game Save remains `ur-game:save:v1` with only `{ version: 1, checkpointId }`. Phone Progress remains `ur-game:phone-progress:v1`. Current BGM, playback time, Mute, volume, and unlock state are not persisted.

No real names, dates, messages, photos, places, private recordings, personal voices, credentials, or third-party copyrighted audio are included.

## Automated verification

The implementation agent does not open or operate the game site. Verification consists of:

```bash
npm run generate:audio
npm run build
git diff --check
```

plus browser-free checks for:

- Audio registry acceptance and rejection cases
- Audio Cue ID/kind/fade validation
- immediate EventRunner AudioActions dispatch
- pending BGM and gesture unlock
- nonfatal `play()` rejection and retry
- BGM fade/crossfade and same-ID non-restart
- SFX lifecycle, Mute/unmute, stop, and dispose
- correct BGM for every Campaign resume suffix
- all Phase 6–13 Checkpoint resolution
- WAV RIFF/PCM structure, sample metadata, sizes, and local source existence
- privacy, credential, external URL, and provenance checks

## Manual acceptance

The user verifies:

1. Reset Progress → New Game starts quiet Main BGM after the user gesture.
2. Autoplay rejection never stops the game or produces an uncaught error.
3. Sound On/Off mutes and restores both channels without affecting gameplay.
4. Phone Story, Dialogue, Tasks, Retry, and Scene changes do not restart or multiply Main BGM.
5. Each Transition Card plays one soft SFX.
6. Selected memory unlocks play one short SFX.
7. Ending crossfades to Ending BGM and plays the final chime once.
8. Continue from middle, before-ending, and completed Checkpoints restores the appropriate BGM once.
9. Existing WASD, Interaction, Phone, Transition, Placement, Reach, Processing, Assembly, Retry, and Ending behavior remains functional.
