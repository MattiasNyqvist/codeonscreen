import type { Keystroke } from '../models/keystroke';
import { MAX_SOUND_LEVEL } from '../models/settings';

/**
 * Synthesised keyboard clicks via the Web Audio API – no audio files, works offline.
 *
 * A click is a few milliseconds of white noise through a band-pass filter with a
 * fast decay. Random pitch and volume per key keep it from sounding like a metronome.
 * Swap {@link KeySounds.play} for recorded samples later if you want a specific keyboard.
 */

/** Gain per level 0–5; 1 is barely audible, 5 is loud. Perceived loudness is logarithmic. */
const LEVEL_GAIN = [0, 0.02, 0.06, 0.14, 0.3, 0.55] as const;

const PREVIEW_SECONDS = 2;
/** Average gap between preview key presses (~12 keys per second). */
const PREVIEW_KEY_INTERVAL = 0.085;

type KeyKind = 'key' | 'space' | 'enter';

const SOUND: Record<KeyKind, { frequency: number; duration: number }> = {
  key: { frequency: 2600, duration: 0.04 },
  space: { frequency: 1400, duration: 0.05 },
  enter: { frequency: 900, duration: 0.09 },
};

/** Plays typing sounds at one of six levels (0 = off). One instance per app. */
export class KeySounds {
  private context: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  private level = 0;
  private previewSources: AudioBufferSourceNode[] = [];

  /**
   * Sets the volume.
   * @param level - 0 (off) to {@link MAX_SOUND_LEVEL}; out-of-range values are clamped.
   */
  setLevel(level: number): void {
    this.level = Math.min(MAX_SOUND_LEVEL, Math.max(0, Math.round(level)));
  }

  /**
   * Browsers only allow audio after a user gesture, so call this from a
   * key or click handler (e.g. when Play is pressed).
   */
  unlock(): void {
    if (this.level > 0) void this.ensureContext().resume();
  }

  /** The sound of one animated key press. Silent until {@link KeySounds.unlock} has run. */
  play(keystroke: Keystroke): void {
    if (this.level === 0) return;

    const context = this.ensureContext();
    if (context.state !== 'running') return;
    this.click(kindOf(keystroke), context.currentTime);
  }

  /**
   * Plays ~2 seconds of typing at the current level so you can hear it
   * before recording. A new preview cancels the previous one.
   */
  async preview(): Promise<void> {
    this.stopPreview();
    if (this.level === 0) return;

    const context = this.ensureContext();
    await context.resume();

    // Schedule on the audio clock: sample-accurate and independent of timers.
    const start = context.currentTime + 0.05;
    let offset = 0;
    while (offset < PREVIEW_SECONDS) {
      const kind: KeyKind = Math.random() < 0.15 ? 'space' : 'key';
      this.previewSources.push(this.click(kind, start + offset));
      offset += PREVIEW_KEY_INTERVAL * vary(0.4);
    }
    this.previewSources.push(this.click('enter', start + PREVIEW_SECONDS));
  }

  private stopPreview(): void {
    for (const source of this.previewSources) {
      try {
        source.stop();
      } catch {
        // Already finished – nothing to stop.
      }
    }
    this.previewSources = [];
  }

  /** One click scheduled at `when` (seconds on the audio clock). */
  private click(kind: KeyKind, when: number): AudioBufferSourceNode {
    const context = this.ensureContext();
    const { frequency, duration } = SOUND[kind];

    const source = context.createBufferSource();
    source.buffer = this.noise;

    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = frequency * vary(0.15);
    filter.Q.value = 1.2;

    const gain = context.createGain();
    gain.gain.setValueAtTime(LEVEL_GAIN[this.level] * vary(0.2), when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    source.connect(filter).connect(gain).connect(context.destination);
    source.start(when, Math.random() * 0.5, duration);
    return source;
  }

  private ensureContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
      this.noise = createNoise(this.context);
    }
    return this.context;
  }
}

function kindOf(keystroke: Keystroke): KeyKind {
  if (keystroke.kind === 'backspace') return 'key';
  if (keystroke.text === '\n') return 'enter';
  if (keystroke.text.trim() === '') return 'space';
  return 'key';
}

/** Random factor around 1, e.g. vary(0.2) → 0.8–1.2. */
function vary(amount: number): number {
  return 1 - amount + Math.random() * amount * 2;
}

function createNoise(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}
