import type { Keystroke } from '../models/keystroke';

const LINE_BREAK_FACTOR = 5;
const PUNCTUATION_FACTOR = 1.8;
/** The pause where a typist notices the mistake before pressing backspace. */
const NOTICE_TYPO_FACTOR = 4;
const JITTER = 0.35;
const PUNCTUATION = new Set([';', '{', '}', ',', '(', ')', '>']);

/**
 * How long to wait before performing `keystroke`.
 *
 * A perfectly even rhythm looks robotic on screen, so there is random jitter
 * and longer pauses before line breaks, "thinking" punctuation and corrections.
 */
export function delayBefore(keystroke: Keystroke, charsPerSecond: number, random: () => number = Math.random): number {
  const base = 1000 / charsPerSecond;
  const jitter = 1 - JITTER + random() * JITTER * 2;
  return base * factorFor(keystroke) * jitter;
}

function factorFor(keystroke: Keystroke): number {
  if (keystroke.kind === 'backspace') return NOTICE_TYPO_FACTOR;
  if (keystroke.text === '\n') return LINE_BREAK_FACTOR;
  if (PUNCTUATION.has(keystroke.text)) return PUNCTUATION_FACTOR;
  return 1;
}
