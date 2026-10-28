import { useEffect, useRef, useState, type RefObject } from 'react';
import type { KeySounds } from '../audio/keySounds';
import type { CodeStageHandle } from '../components/stage/CodeStage';
import type { TypingLine } from '../editor/geometry';
import { pickFrameColor } from '../frame/colors';
import { previousContentLine } from '../frame/lines';
import { createHint, tickHints } from '../hints/lifetime';
import type { Frame, FrameColor, LineRange } from '../models/frame';
import type { LineHint } from '../models/hint';
import type { PlaybackState } from '../models/playback';
import { getLanguage } from '../models/language';
import type { Settings } from '../models/settings';
import { prepareSource } from '../source/prepareSource';
import { useTypewriter } from './useTypewriter';

/** How often bubble reading time is advanced while playing. */
const HINT_TICK_MS = 100;

/** What {@link usePresenter} gives the app: state to render and one action per Presentation Mode key. */
export interface Presenter {
  state: PlaybackState;
  frame: Frame | null;
  hints: LineHint[];
  zoomRange: LineRange | null;
  typingLine: TypingLine | null;
  /** The current `@@step` title, shown next to the file name, or null. */
  step: string | null;
  /** Space: play, pause or resume. */
  togglePlay(): void;
  /** N (new start): empty the editor and go back to the start of the take. */
  stop(): void;
  /** H: frame the current line, or grow the frame one line up. */
  frameOrGrow(): void;
  /** Z: zoom in on the frame, or back out. */
  toggleZoom(): void;
}

/**
 * Everything that happens in Presentation Mode: playback, the highlight, callouts and
 * zoom. Returns state for rendering and one action per key.
 */
export function usePresenter(
  stage: RefObject<CodeStageHandle | null>,
  settings: Settings,
  sounds: KeySounds,
): Presenter {
  const [frame, setFrame] = useState<Frame | null>(null);
  const [hints, setHints] = useState<LineHint[]>([]);
  const [zoomRange, setZoomRange] = useState<LineRange | null>(null);
  const [typingLine, setTypingLine] = useState<TypingLine | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const hintTextsRef = useRef<ReadonlyMap<number, string>>(new Map());
  /** The script's highlight and pause lines for the take being played. */
  const scriptRef = useRef<{
    highlights: ReadonlySet<number>;
    pauses: ReadonlySet<number>;
    steps: ReadonlyMap<number, string>;
  }>({ highlights: new Set(), pauses: new Set(), steps: new Map() });
  const codeLinesRef = useRef<string[]>([]);
  const nextFrameIdRef = useRef(1);
  /** Remembered so mix never gives two frames in a row the same colour. */
  const lastFrameColorRef = useRef<FrameColor | null>(null);

  const lastLine = () => stage.current?.getLastLine() ?? 1;

  const playback = useTypewriter(stage, settings.speed, {
    onReset: () => {
      setFrame(null);
      setHints([]);
      setZoomRange(null);
      setTypingLine(null);
      setStep(null);
    },
    onKeystroke: (keystroke) => sounds.play(keystroke),
    onLineComplete: (line) => {
      // Read the line now. React may run an updater later – after the line break has been typed.
      const screenLine = lastLine();
      const text = hintTextsRef.current.get(line);
      if (text) {
        const hint = createHint(screenLine, text);
        setHints((current) => [...current, hint]);
      }

      // The script: @@highlight draws the box and pauses, like H; @@pause just pauses.
      // Called before the line break is typed, so the engine stops right at the end of this line.
      const { highlights, pauses, steps } = scriptRef.current;
      // A step starts with its first line: switch the title as soon as the line before it is done.
      const nextStep = steps.get(line + 1);
      if (nextStep) setStep(nextStep);
      if (highlights.has(line) && !frame) frameLine(screenLine);
      if (highlights.has(line) || pauses.has(line)) playback.pauseAtLineEnd();
    },
    // The frame was drawn when H was pressed; now the line is finished it can be measured for real.
    onLineEndPause: () => setTypingLine(null),
  });

  const { state } = playback;
  const isPausedOrFinished = state === 'paused' || state === 'finished';

  // Bubble reading time runs while playing, paused and finished – bubbles fade once they have been
  // read. During a pause the bubble on the line it stopped at stays: that line is being explained.
  useEffect(() => {
    if (state === 'idle') return;

    const heldLine = state === 'paused' ? lastLine() : undefined;
    let previous = performance.now();
    const timerId = setInterval(() => {
      const now = performance.now();
      const elapsed = now - previous;
      previous = now;
      setHints((current) => (current.length > 0 ? tickHints(current, elapsed, heldLine) : current));
    }, HINT_TICK_MS);

    return () => clearInterval(timerId);
    // lastLine reads a ref; the held line only needs to be read when a pause begins.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const frameLine = (line: number) => {
    const color = pickFrameColor(settings.frameColor, lastFrameColorRef.current);
    lastFrameColorRef.current = color;
    setFrame({ id: nextFrameIdRef.current++, startLine: line, endLine: line, color });
  };

  const play = () => {
    sounds.unlock();

    if (state === 'paused') {
      // Continuing removes the frame and zooms out.
      setFrame(null);
      setZoomRange(null);
      setTypingLine(null);
      playback.play('');
      return;
    }
    if (settings.source.trim() === '') return;

    const language = getLanguage(settings.languageId);
    const prepared = prepareSource(settings.source, language.comments, {
      enabled: settings.scriptMarkers,
      markers: settings.markers,
    });
    hintTextsRef.current = prepared.hints;
    scriptRef.current = { highlights: prepared.highlights, pauses: prepared.pauses, steps: prepared.steps };
    codeLinesRef.current = prepared.code.split('\n');
    playback.play(prepared.code, { typos: settings.typos });
    // After play(): starting resets the screen, and with it the step.
    setStep(prepared.steps.get(1) ?? null);
  };

  /**
   * H. First press: frame the current line. While typing, the frame appears at
   * once at the line's final size and playback pauses when the line is done.
   * Each further press grows the frame upwards by one line with content.
   */
  const frameOrGrow = () => {
    if (frame) {
      const isBlank = (line: number) => stage.current?.isLineBlank(line) ?? true;
      const above = previousContentLine(frame.startLine, isBlank);
      if (above !== null) setFrame({ ...frame, startLine: above });
      return;
    }

    if (state === 'playing') {
      const line = lastLine();
      const finalText = codeLinesRef.current[playback.getCurrentLine() - 1] ?? '';
      setTypingLine({ line, finalText });
      frameLine(line);
      playback.pauseAtLineEnd();
    } else if (isPausedOrFinished) {
      frameLine(lastLine());
    }
  };

  /** Z. Zooms in on the frame (or the current line), or back out. */
  const toggleZoom = () => {
    if (!isPausedOrFinished) return;
    if (zoomRange) {
      setZoomRange(null);
      return;
    }
    const line = lastLine();
    setZoomRange(frame ? { startLine: frame.startLine, endLine: frame.endLine } : { startLine: line, endLine: line });
  };

  return {
    state,
    frame,
    hints,
    zoomRange,
    typingLine,
    step,
    togglePlay: () => (state === 'playing' ? playback.pause() : play()),
    stop: playback.stop,
    frameOrGrow,
    toggleZoom,
  };
}
