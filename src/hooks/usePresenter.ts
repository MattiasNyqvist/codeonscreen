import { useEffect, useRef, useState, type RefObject } from 'react';
import type { KeySounds } from '../audio/keySounds';
import type { CodeStageHandle } from '../components/stage/CodeStage';
import type { TypingLine } from '../editor/geometry';
import { pickFrameColor } from '../frame/colors';
import { previousContentLine } from '../frame/lines';
import { createHint, createSubtitle, tickHints, tickSubtitle } from '../hints/lifetime';
import type { Frame, FrameColor, LineRange } from '../models/frame';
import type { LineHint, StepCard, Subtitle } from '../models/hint';
import type { PlaybackState } from '../models/playback';
import { getLanguage } from '../models/language';
import type { Settings } from '../models/settings';
import { prepareSource } from '../source/prepareSource';
import { useTypewriter } from './useTypewriter';

/** How often bubble reading time is advanced while playing. */
const HINT_TICK_MS = 100;

/** How long a step card is shown, fade in and out included. Must match `step-card` in app.css. */
export const STEP_CARD_MS = 4000;

/** What {@link usePresenter} gives the app: state to render and one action per Presentation Mode key. */
export interface Presenter {
  state: PlaybackState;
  frame: Frame | null;
  hints: LineHint[];
  zoomRange: LineRange | null;
  typingLine: TypingLine | null;
  /** The subtitle on screen, or null. */
  subtitle: Subtitle | null;
  /** The `@@step` title card on screen, or null. Typing waits while it is shown. */
  stepCard: StepCard | null;
  /** Space: play, pause or resume. */
  togglePlay(): void;
  /** N (new start): empty the editor and go back to the start of the take. */
  stop(): void;
  /** H: frame the current line, or grow the frame one line up. */
  frameOrGrow(): void;
  /** Z: zoom in on the frame, or back out. */
  toggleZoom(): void;
  /** Mouse wheel up: zoom in, if not already. */
  zoomIn(): void;
  /** Mouse wheel down: zoom out, if zoomed in. */
  zoomOut(): void;
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
  const [subtitle, setSubtitle] = useState<Subtitle | null>(null);
  const [stepCard, setStepCard] = useState<StepCard | null>(null);
  const hintTextsRef = useRef<ReadonlyMap<number, string>>(new Map());
  const subtitleTextsRef = useRef<ReadonlyMap<number, string>>(new Map());
  const nextSubtitleIdRef = useRef(1);
  /** A step whose card has not been shown yet: typing waits at the end of the line before it. */
  const pendingStepRef = useRef<string | null>(null);
  const stepCardIdRef = useRef(1);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isStepCardShownRef = useRef(false);
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
      setSubtitle(null);
      cancelStepCard();
      pendingStepRef.current = null;
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
      const subtitleText = subtitleTextsRef.current.get(line);
      if (subtitleText) setSubtitle(createSubtitle(nextSubtitleIdRef.current++, screenLine, subtitleText));

      // A step card comes before the step's first line: typing stops at the end of the line before it.
      const nextStep = steps.get(line + 1);
      if (nextStep) pendingStepRef.current = nextStep;
      if (highlights.has(line) && !frame) frameLine(screenLine);
      if (highlights.has(line) || pauses.has(line) || nextStep) playback.pauseAtLineEnd();
    },
    // The frame was drawn when H was pressed; now the line is finished it can be measured for real.
    onLineEndPause: () => {
      setTypingLine(null);
      // Typing stopped for a step: show the card now – unless the script or H holds it here, in which
      // case the card comes when the presenter continues.
      const { highlights, pauses } = scriptRef.current;
      const line = playback.getCurrentLine();
      const isHeld = highlights.has(line) || pauses.has(line) || frame !== null;
      if (pendingStepRef.current && !isHeld) showStepCard(pendingStepRef.current);
    },
  });

  /** Removes the step card and its timer – nothing resumes. */
  function cancelStepCard() {
    clearTimeout(stepTimerRef.current);
    isStepCardShownRef.current = false;
    setStepCard(null);
  }

  /** Ends the step card and carries on typing. */
  function endStepCard() {
    cancelStepCard();
    playback.play('');
  }

  /** Shows the step card for {@link STEP_CARD_MS} while typing waits, then carries on by itself. */
  function showStepCard(title: string) {
    pendingStepRef.current = null;
    isStepCardShownRef.current = true;
    setStepCard({ id: stepCardIdRef.current++, title });
    stepTimerRef.current = setTimeout(endStepCard, STEP_CARD_MS);
  }

  useEffect(() => () => clearTimeout(stepTimerRef.current), []);

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
      // Bubbles and subtitles wait behind a step card: their reading time starts when it is gone.
      if (isStepCardShownRef.current) return;
      setHints((current) => (current.length > 0 ? tickHints(current, elapsed, heldLine) : current));
      setSubtitle((current) => (current ? tickSubtitle(current, elapsed, heldLine) : current));
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
    // The take is over: Space does not start it again. N (new start) is the way to begin anew,
    // so a stray key press at the end never wipes the screen in the middle of a recording.
    if (state === 'finished') return;
    sounds.unlock();

    if (state === 'paused') {
      // Continuing removes the frame and zooms out.
      setFrame(null);
      setZoomRange(null);
      setTypingLine(null);
      // Space during a step card skips the rest of it.
      if (isStepCardShownRef.current) endStepCard();
      // A step is next: its card comes first, then typing carries on.
      else if (pendingStepRef.current) showStepCard(pendingStepRef.current);
      else playback.play('');
      return;
    }
    if (settings.source.trim() === '') return;

    const language = getLanguage(settings.languageId);
    const prepared = prepareSource(settings.source, language.comments, {
      enabled: settings.scriptMarkers,
      markers: settings.markers,
    });
    hintTextsRef.current = prepared.hints;
    subtitleTextsRef.current = prepared.subtitles;
    scriptRef.current = { highlights: prepared.highlights, pauses: prepared.pauses, steps: prepared.steps };
    codeLinesRef.current = prepared.code.split('\n');
    playback.play(prepared.code, { typos: settings.typos });
    // A step on the very first line: its card comes before anything is typed. After play(), because
    // starting resets the screen.
    const firstStep = prepared.steps.get(1);
    if (firstStep) {
      playback.pause();
      showStepCard(firstStep);
    }
  };

  /**
   * H. First press: frame the current line. While typing, the frame appears at
   * once at the line's final size and playback pauses when the line is done.
   * Each further press grows the frame upwards by one line with content.
   */
  const frameOrGrow = () => {
    if (isStepCardShownRef.current) return;
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
  const toggleZoom = () => (zoomRange ? zoomOut() : zoomIn());

  /** Zooms in on the frame (or the current line). Only while paused, and only if not already zoomed. */
  function zoomIn() {
    if (!isPausedOrFinished || isStepCardShownRef.current || zoomRange) return;
    const line = lastLine();
    setZoomRange(frame ? { startLine: frame.startLine, endLine: frame.endLine } : { startLine: line, endLine: line });
  }

  /** Zooms back out. */
  function zoomOut() {
    if (!isPausedOrFinished || isStepCardShownRef.current) return;
    setZoomRange(null);
  }

  return {
    state,
    frame,
    hints,
    zoomRange,
    typingLine,
    subtitle,
    stepCard,
    togglePlay: () => (state === 'playing' ? playback.pause() : play()),
    stop: playback.stop,
    frameOrGrow,
    toggleZoom,
    zoomIn,
    zoomOut,
  };
}
