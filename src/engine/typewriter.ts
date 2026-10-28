import { isLineBreak, type Keystroke } from '../models/keystroke';
import { SPEED_LIMITS, type PlaybackState } from '../models/playback';
import { delayBefore } from './timing';
import { tokenize } from './tokenize';
import { TYPO_RATE, planKeystrokes } from './typos';

/**
 * Where the engine sends its output. It knows nothing about Monaco or React –
 * that is what makes it testable with plain functions.
 */
export interface TypewriterEvents {
  /** The output must be emptied (start or stop). */
  onReset(): void;
  /** Append text typed by one keystroke. */
  onType(text: string): void;
  /** Remove the last character (correcting a typo). */
  onBackspace(): void;
  /** The engine moved to a new {@link PlaybackState}. */
  onStateChange(state: PlaybackState): void;
  /** One animated key press – used for sound. */
  onKeystroke?(keystroke: Keystroke): void;
  /** Line `line` (1-based) is fully typed. Fired once per line. */
  onLineComplete?(line: number): void;
  /** Playback stopped at the end of a line because {@link Typewriter.pauseAtLineEnd} was called. */
  onLineEndPause?(): void;
}

/** Used until {@link Typewriter.connect} is called, so the engine never has to null-check. */
const SILENT_EVENTS: TypewriterEvents = {
  onReset: () => {},
  onType: () => {},
  onBackspace: () => {},
  onStateChange: () => {},
};

/** Options for {@link Typewriter.play} when starting from the beginning. */
export interface PlayOptions {
  /** Mistype now and then and correct it with backspace. */
  typos?: boolean;
}

/**
 * A small state machine that performs keystrokes on a timer.
 *
 * ```text
 * idle ──play──▶ playing ──pause──▶ paused ──play──▶ playing
 *                   │                  │
 *                (done)              stop ──▶ idle
 *                   ▼
 *                finished ──play──▶ playing (restart)
 * ```
 */
export class Typewriter {
  private keystrokes: readonly Keystroke[] = [];
  private position = 0;
  private line = 1;
  private lastCompletedLine = 0;
  private pauseAtLineEndRequested = false;
  private timerId: ReturnType<typeof setTimeout> | undefined;
  private state: PlaybackState = 'idle';

  /**
   * @param events - where output goes; can also be set later with {@link Typewriter.connect}
   * @param charsPerSecond - initial typing speed
   * @param random - injectable for deterministic tests
   */
  constructor(
    private events: TypewriterEvents = SILENT_EVENTS,
    private charsPerSecond: number = SPEED_LIMITS.default,
    private readonly random: () => number = Math.random,
  ) {}

  /** Replaces where output goes. React calls this after every render so callbacks are never stale. */
  connect(events: TypewriterEvents): void {
    this.events = events;
  }

  /** 1-based line of the source currently being typed. */
  get currentLine(): number {
    return this.line;
  }

  /** Starts from the beginning, or resumes if paused (arguments are then ignored). */
  play(source: string, options: PlayOptions = {}): void {
    if (this.state === 'playing') return;

    if (this.state !== 'paused') {
      const typoRate = options.typos ? TYPO_RATE : 0;
      this.keystrokes = planKeystrokes(tokenize(source), typoRate, this.random);
      this.resetProgress();
      this.events.onReset();
    }

    this.setState('playing');
    this.scheduleNext();
  }

  /** Stops typing where it is; {@link Typewriter.play} continues from there. */
  pause(): void {
    if (this.state !== 'playing') return;
    this.clearTimer();
    this.pauseAtLineEndRequested = false;
    this.setState('paused');
  }

  /** Finishes the current line, then pauses. */
  pauseAtLineEnd(): void {
    if (this.state === 'playing') this.pauseAtLineEndRequested = true;
  }

  /** Stops, empties the output and goes back to `idle`. */
  stop(): void {
    this.clearTimer();
    this.keystrokes = [];
    this.resetProgress();
    this.events.onReset();
    this.setState('idle');
  }

  /** Takes effect from the next keystroke, so speed can change mid-playback. */
  setSpeed(charsPerSecond: number): void {
    this.charsPerSecond = Math.min(SPEED_LIMITS.max, Math.max(SPEED_LIMITS.min, charsPerSecond));
  }

  /** Stops the timer without changing state – call when the owner goes away. */
  dispose(): void {
    this.clearTimer();
  }

  private scheduleNext(): void {
    const keystroke = this.keystrokes[this.position];
    if (keystroke === undefined) {
      this.finish();
      return;
    }

    const delay = delayBefore(keystroke, this.charsPerSecond, this.random);
    this.timerId = setTimeout(() => this.perform(keystroke), delay);
  }

  private perform(keystroke: Keystroke): void {
    this.timerId = undefined;

    if (isLineBreak(keystroke)) {
      this.completeLine();
      if (this.pauseAtLineEndRequested) {
        this.pauseAtLineEndRequested = false;
        this.setState('paused');
        this.events.onLineEndPause?.();
        return;
      }
      this.line++;
    }

    if (keystroke.kind === 'backspace') this.events.onBackspace();
    else this.events.onType(keystroke.text);

    this.events.onKeystroke?.(keystroke);
    this.position++;
    this.scheduleNext();
  }

  private finish(): void {
    this.completeLine();
    const pauseRequested = this.pauseAtLineEndRequested;
    this.pauseAtLineEndRequested = false;

    this.setState('finished');
    if (pauseRequested) this.events.onLineEndPause?.();
  }

  /** Resuming performs the same line break again, so guard against firing twice. */
  private completeLine(): void {
    if (this.line <= this.lastCompletedLine) return;
    this.lastCompletedLine = this.line;
    this.events.onLineComplete?.(this.line);
  }

  private resetProgress(): void {
    this.position = 0;
    this.line = 1;
    this.lastCompletedLine = 0;
    this.pauseAtLineEndRequested = false;
  }

  private clearTimer(): void {
    clearTimeout(this.timerId);
    this.timerId = undefined;
  }

  private setState(state: PlaybackState): void {
    this.state = state;
    this.events.onStateChange(state);
  }
}
