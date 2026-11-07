import type { CommentSyntax } from '../models/language';
import {
  DEFAULT_SCRIPT_OPTIONS,
  isCommentOnly,
  isMarkerOn,
  readMarkerLine,
  type ScriptOptions,
} from '../models/script';

/** The result of {@link extractScript}: the code to type and what the script asks for. */
export interface ExtractedScript {
  /** The code with every marker line removed. */
  code: string;
  /** Callout text keyed by 1-based line number in `code`. */
  hints: ReadonlyMap<number, string>;
  /** Lines (1-based, in `code`) that get a highlight box when typed; typing then pauses. */
  highlights: ReadonlySet<number>;
  /** Subtitle text keyed by 1-based line number in `code`, shown once that line is typed. */
  subtitles: ReadonlyMap<number, string>;
  /** Lines after which typing pauses. */
  pauses: ReadonlySet<number>;
  /** Step titles keyed by the first line of each step – the line that has content, a comment included. */
  steps: ReadonlyMap<number, string>;
}

/**
 * Reads the script out of the code, line by line:
 *
 *   // @@callout Create the app   ← marker line: removed, and given
 *   // Build it once              ← (a plain comment is code, but no callout lands on it)
 *   var app = builder.Build();    ← to the next line of code
 *
 * Every line with a marker is removed – see `models/script.ts` for the rules.
 * A marker that is switched off, or a misspelled one, does nothing else.
 * Consecutive callouts, or consecutive subtitles, for the same line are joined into one.
 */
export function extractScript(
  source: string,
  syntax: CommentSyntax,
  options: ScriptOptions = DEFAULT_SCRIPT_OPTIONS,
): ExtractedScript {
  const code: string[] = [];
  const hints = new Map<number, string>();
  const highlights = new Set<number>();
  const subtitles = new Map<number, string>();
  const pauses = new Set<number>();
  const steps = new Map<number, string>();

  // What is waiting for the next line of code.
  let notes: string[] = [];
  let subtitle: string[] = [];
  let highlight = false;
  let pause = false;
  let step = '';

  for (const line of source.replace(/\r\n?/g, '\n').split('\n')) {
    const found = readMarkerLine(line, syntax);

    if (found === null) {
      code.push(line);
      if (line.trim() === '') continue;
      // A step starts at the next line with any content, so its card comes before the comment that introduces it.
      if (step) {
        steps.set(code.length, step);
        step = '';
      }
      if (isCommentOnly(line, syntax)) continue;
      // A line of code: it gets everything that was waiting.
      const at = code.length;
      if (notes.length > 0) hints.set(at, notes.join(' '));
      if (subtitle.length > 0) subtitles.set(at, subtitle.join(' '));
      if (highlight) highlights.add(at);
      if (pause) pauses.add(at);
      notes = [];
      subtitle = [];
      highlight = pause = false;
      continue;
    }

    const { marker, text } = found;
    if (marker === null || !isMarkerOn(options, marker)) continue;
    if (marker === 'step') {
      if (text) step = text;
      continue;
    }
    if (marker === 'subtitle') {
      if (text) subtitle.push(text);
      continue;
    }
    if (text) notes.push(text);
    if (marker === 'highlight') highlight = true;
    if (marker === 'pause') pause = true;
  }

  return { code: code.join('\n'), hints, subtitles, highlights, pauses, steps };
}
