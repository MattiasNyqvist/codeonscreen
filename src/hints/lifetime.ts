import type { LineHint } from '../models/hint';

/**
 * How long a bubble stays, based on subtitle practice: adults read about
 * 15 characters per second, but here the viewer is also following the code,
 * so we assume a slower 12 plus a fixed 1.5 s to notice the bubble at all.
 */
const BASE_MS = 1500;
const CHARS_PER_SECOND = 12;
const MIN_MS = 3000;
const MAX_MS = 10_000;

/** Must match the opacity transition on `.hint-bubble--fading` in app.css. */
export const FADE_MS = 500;

/** How long a bubble with this text stays before it starts to fade. */
export function readingTimeMs(text: string): number {
  const ms = BASE_MS + (text.length / CHARS_PER_SECOND) * 1000;
  return Math.min(MAX_MS, Math.max(MIN_MS, ms));
}

/** A new bubble for `line` with a full reading time. */
export function createHint(line: number, text: string): LineHint {
  return { line, text, remainingMs: readingTimeMs(text) };
}

/** True once the reading time is used up and the bubble is fading out. */
export function isFading(hint: LineHint): boolean {
  return hint.remainingMs <= 0;
}

/**
 * Advances every bubble's clock and drops the ones that have finished fading.
 * The clock runs during pauses too – a bubble is there to be read, and reading
 * does not stop because the typing has. Only the bubble on `heldLine`, the line
 * a pause is waiting at, keeps its time: that is the line being talked about.
 */
export function tickHints(hints: readonly LineHint[], elapsedMs: number, heldLine?: number): LineHint[] {
  return hints
    .map((hint) => (hint.line === heldLine ? hint : { ...hint, remainingMs: hint.remainingMs - elapsedMs }))
    .filter((hint) => hint.remainingMs > -FADE_MS);
}
