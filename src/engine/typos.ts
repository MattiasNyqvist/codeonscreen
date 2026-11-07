import { BACKSPACE, type Keystroke, typeKey } from '../models/keystroke';

/**
 * Chance that a letter in the middle of a word is mistyped.
 * At ~30 letters per line this gives roughly one typo every three lines.
 */
export const TYPO_RATE = 0.012;

/** Neighbouring keys on a QWERTY keyboard – realistic typos hit the key next door. */
const NEIGHBOURS: Record<string, string> = {
  q: 'wa',
  w: 'qes',
  e: 'wrd',
  r: 'etf',
  t: 'ryg',
  y: 'tuh',
  u: 'yij',
  i: 'uok',
  o: 'ipl',
  p: 'ol',
  a: 'qsz',
  s: 'awdx',
  d: 'sefc',
  f: 'drgv',
  g: 'fthb',
  h: 'gyjn',
  j: 'hukm',
  k: 'jil',
  l: 'kop',
  z: 'asx',
  x: 'zsdc',
  c: 'xdfv',
  v: 'cfgb',
  b: 'vghn',
  n: 'bhjm',
  m: 'njk',
};

const LETTER = /^[a-z]$/i;

/**
 * Turns text chunks into keystrokes, occasionally inserting a typo that is
 * immediately corrected: wrong letter → backspace → right letter.
 *
 * Only letters inside a word are mistyped (never the first letter, never
 * symbols or whitespace), which is where real typos tend to happen and where
 * a correction looks natural on screen.
 *
 * @param random - injectable so tests can be deterministic; defaults to Math.random
 */
export function planKeystrokes(
  chunks: readonly string[],
  typoRate = 0,
  random: () => number = Math.random,
): Keystroke[] {
  const keystrokes: Keystroke[] = [];

  chunks.forEach((chunk, index) => {
    const isInsideWord = LETTER.test(chunk) && index > 0 && LETTER.test(chunks[index - 1]);
    if (isInsideWord && random() < typoRate) {
      keystrokes.push(typeKey(wrongKeyFor(chunk, random)), BACKSPACE);
    }
    keystrokes.push(typeKey(chunk));
  });

  return keystrokes;
}

function wrongKeyFor(letter: string, random: () => number): string {
  const options = NEIGHBOURS[letter.toLowerCase()];
  const wrong = options[Math.floor(random() * options.length)];
  return letter === letter.toUpperCase() ? wrong.toUpperCase() : wrong;
}
