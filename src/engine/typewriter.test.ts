import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Keystroke } from '../models/keystroke';
import type { PlaybackState } from '../models/playback';
import { Typewriter } from './typewriter';

/** A typewriter wired to plain arrays, so tests can inspect everything it did. */
function createRecorder(random: () => number = () => 0.5) {
  const record = {
    output: '',
    states: [] as PlaybackState[],
    keystrokes: [] as Keystroke[],
    completedLines: [] as number[],
    lineEndPauses: 0,
  };

  const typewriter = new Typewriter(
    {
      onReset: () => (record.output = ''),
      onType: (text) => (record.output += text),
      onBackspace: () => (record.output = record.output.slice(0, -1)),
      onStateChange: (state) => record.states.push(state),
      onKeystroke: (keystroke) => record.keystrokes.push(keystroke),
      onLineComplete: (line) => record.completedLines.push(line),
      onLineEndPause: () => record.lineEndPauses++,
    },
    100,
    random,
  );

  return { typewriter, record };
}

describe('Typewriter', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('types the whole source and finishes', () => {
    const { typewriter, record } = createRecorder();
    typewriter.play('ab\ncd');
    vi.runAllTimers();

    expect(record.output).toBe('ab\ncd');
    expect(record.states).toEqual(['playing', 'finished']);
    expect(record.completedLines).toEqual([1, 2]);
  });

  it('pauses without losing position and resumes', () => {
    const { typewriter, record } = createRecorder();
    typewriter.play('hello');
    vi.advanceTimersByTime(25);
    typewriter.pause();
    const typedAtPause = record.output;
    vi.runAllTimers();
    expect(record.output).toBe(typedAtPause);

    typewriter.play('ignored while paused');
    vi.runAllTimers();
    expect(record.output).toBe('hello');
  });

  it('pauseAtLineEnd finishes the line, then pauses', () => {
    const { typewriter, record } = createRecorder();
    typewriter.play('first\nsecond');
    vi.advanceTimersByTime(15);
    typewriter.pauseAtLineEnd();
    vi.runAllTimers();

    expect(record.output).toBe('first');
    expect(record.lineEndPauses).toBe(1);
    expect(record.states.at(-1)).toBe('paused');

    typewriter.play('');
    vi.runAllTimers();
    expect(record.output).toBe('first\nsecond');
    expect(record.completedLines).toEqual([1, 2]);
  });

  it('corrects typos so the final text is exactly the source', () => {
    // random() = 0 makes every eligible letter a typo.
    const { typewriter, record } = createRecorder(() => 0);
    typewriter.play('the cat', { typos: true });
    vi.runAllTimers();

    expect(record.output).toBe('the cat');
    expect(record.keystrokes.some((keystroke) => keystroke.kind === 'backspace')).toBe(true);
  });

  it('stop clears output and returns to idle', () => {
    const { typewriter, record } = createRecorder();
    typewriter.play('hello');
    vi.advanceTimersByTime(25);
    typewriter.stop();
    vi.runAllTimers();

    expect(record.output).toBe('');
    expect(record.states.at(-1)).toBe('idle');
  });
});
