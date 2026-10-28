import { useCallback, useEffect, useState, type RefObject } from 'react';
import { Typewriter, type PlayOptions } from '../engine/typewriter';
import type { Keystroke } from '../models/keystroke';
import type { PlaybackState } from '../models/playback';

/** The minimal surface the typewriter needs from the editor. */
export interface TypingTarget {
  /** Removes all text. */
  clear(): void;
  /** Adds text at the end and moves the cursor there. */
  append(text: string): void;
  /** Removes the last character (never a line break). */
  backspace(): void;
  /** Gives the editor keyboard focus so its cursor blinks. */
  focus(): void;
}

/** Optional hooks into the engine for things that sit on top of the text. */
export interface PlaybackEvents {
  /** The screen was emptied – anything drawn on top of the code is now stale. */
  onReset?(): void;
  /** One animated key press (for sound). */
  onKeystroke?(keystroke: Keystroke): void;
  /** A line of the animated source is fully typed. */
  onLineComplete?(line: number): void;
  /** Playback paused at a line end because H was pressed. */
  onLineEndPause?(): void;
}

/** What {@link useTypewriter} gives its caller. */
export interface Playback {
  state: PlaybackState;
  /** Starts from the beginning, or resumes when paused. */
  play(source: string, options?: PlayOptions): void;
  /** Stops where it is. */
  pause(): void;
  /** Finishes the current line, then pauses. */
  pauseAtLineEnd(): void;
  /** Stops and empties the editor. */
  stop(): void;
  /** 1-based line of the animated source being typed. */
  getCurrentLine(): number;
}

/**
 * Bridges the framework-free {@link Typewriter} into React.
 *
 * The engine is created once (useState's lazy initialiser) without any events.
 * An effect then connects it to the editor and to the latest callbacks after
 * every render – so callbacks are never stale and nothing is read during render.
 */
export function useTypewriter(
  target: RefObject<TypingTarget | null>,
  speed: number,
  events: PlaybackEvents = {},
): Playback {
  const [state, setState] = useState<PlaybackState>('idle');
  const [engine] = useState(() => new Typewriter());

  useEffect(() => {
    engine.connect({
      onReset: () => {
        target.current?.clear();
        events.onReset?.();
      },
      onType: (text) => target.current?.append(text),
      onBackspace: () => target.current?.backspace(),
      onStateChange: setState,
      onKeystroke: events.onKeystroke,
      onLineComplete: events.onLineComplete,
      onLineEndPause: events.onLineEndPause,
    });
    // `events` is a new object every render, so in practice this reconnects after each render.
  }, [engine, events, target]);

  useEffect(() => engine.setSpeed(speed), [engine, speed]);
  useEffect(() => () => engine.dispose(), [engine]);

  const play = useCallback(
    (source: string, options?: PlayOptions) => {
      // Focus keeps the cursor visible and blinking while recording.
      target.current?.focus();
      engine.play(source, options);
    },
    [engine, target],
  );

  return {
    state,
    play,
    pause: useCallback(() => engine.pause(), [engine]),
    pauseAtLineEnd: useCallback(() => engine.pauseAtLineEnd(), [engine]),
    stop: useCallback(() => engine.stop(), [engine]),
    getCurrentLine: useCallback(() => engine.currentLine, [engine]),
  };
}
