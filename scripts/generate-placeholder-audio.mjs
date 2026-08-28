import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 22_050;
const BYTES_PER_SAMPLE = 2;
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = resolve(projectRoot, 'public/audio');

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function smoothEnvelope(time, duration, attack, release) {
  const attackGain = clamp(time / attack, 0, 1);
  const releaseGain = clamp((duration - time) / release, 0, 1);
  return Math.sin(Math.min(attackGain, releaseGain) * Math.PI * 0.5) ** 2;
}

function seamlessFrequency(frequency, duration) {
  return Math.round(frequency * duration) / duration;
}

function createAmbientLoop(duration, frequencies, character) {
  const seamlessFrequencies = frequencies.map((frequency) => (
    seamlessFrequency(frequency, duration)
  ));
  return (time) => {
    const slowPulse = 0.76 + 0.12 * Math.sin((Math.PI * 2 * time) / duration - Math.PI / 2);
    const shimmer = 0.8 + 0.2 * Math.sin((Math.PI * 4 * time) / duration + character);
    let sample = 0;
    for (const [index, frequency] of seamlessFrequencies.entries()) {
      const weight = index === 0 ? 0.24 : 0.12 / (1 + index * 0.12);
      const phase = index * character;
      sample += Math.sin(Math.PI * 2 * frequency * time + phase) * weight;
    }
    const upperTone = seamlessFrequency(frequencies.at(-1) * 2, duration);
    sample += Math.sin(Math.PI * 2 * upperTone * time + character) * 0.035 * shimmer;
    return sample * slowPulse * 0.72;
  };
}

function createTransitionSfx(duration) {
  return (time) => {
    const progress = time / duration;
    const envelope = smoothEnvelope(time, duration, 0.08, 0.26);
    const frequency = 360 + 300 * progress;
    const tone = Math.sin(Math.PI * 2 * frequency * time);
    const air = Math.sin(Math.PI * 2 * frequency * 2.01 * time + 0.4) * 0.28;
    return (tone + air) * envelope * 0.38;
  };
}

function createMemorySfx(duration) {
  const notes = [523.25, 659.25, 783.99];
  return (time) => {
    let sample = 0;
    for (const [index, frequency] of notes.entries()) {
      const start = index * 0.13;
      const localTime = time - start;
      if (localTime < 0) {
        continue;
      }
      const envelope = smoothEnvelope(localTime, duration - start, 0.025, 0.34);
      sample += Math.sin(Math.PI * 2 * frequency * localTime) * envelope * 0.22;
    }
    return sample;
  };
}

function createEndingChime(duration) {
  const notes = [261.63, 329.63, 392, 523.25];
  return (time) => {
    const envelope = smoothEnvelope(time, duration, 0.035, 0.85);
    let sample = 0;
    for (const [index, frequency] of notes.entries()) {
      sample += Math.sin(Math.PI * 2 * frequency * time + index * 0.15) * 0.16;
      sample += Math.sin(Math.PI * 2 * frequency * 2.003 * time) * 0.035;
    }
    return sample * envelope;
  };
}

function encodeMonoWav(duration, sampleAtTime) {
  const sampleCount = Math.floor(SAMPLE_RATE * duration);
  const dataSize = sampleCount * BYTES_PER_SAMPLE;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * BYTES_PER_SAMPLE, 28);
  buffer.writeUInt16LE(BYTES_PER_SAMPLE, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / SAMPLE_RATE;
    const sample = clamp(sampleAtTime(time), -0.98, 0.98);
    buffer.writeInt16LE(Math.round(sample * 32_767), 44 + index * BYTES_PER_SAMPLE);
  }
  return buffer;
}

const assets = [
  {
    name: 'campaign-main-loop.wav',
    duration: 8,
    render: createAmbientLoop(8, [130.81, 196, 246.94, 293.66, 329.63], 0.37),
  },
  {
    name: 'campaign-ending-loop.wav',
    duration: 8,
    render: createAmbientLoop(8, [174.61, 261.63, 329.63, 392, 440], 0.61),
  },
  {
    name: 'transition-soft.wav',
    duration: 0.85,
    render: createTransitionSfx(0.85),
  },
  {
    name: 'memory-unlock.wav',
    duration: 0.9,
    render: createMemorySfx(0.9),
  },
  {
    name: 'ending-chime.wav',
    duration: 1.7,
    render: createEndingChime(1.7),
  },
];

mkdirSync(outputDirectory, { recursive: true });
for (const asset of assets) {
  const outputPath = resolve(outputDirectory, asset.name);
  writeFileSync(outputPath, encodeMonoWav(asset.duration, asset.render));
  console.log(`Generated ${asset.name}`);
}
