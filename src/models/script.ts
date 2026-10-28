import type { CommentSyntax } from './language';

/**
 * Script markers: lines that tell the presentation what to do.
 *
 * ```text
 * // A plain comment            ← ordinary code, typed like any other line
 * // @@callout Look at this     ← a speech bubble beside the next line
 * // @@highlight                ← a box around the next line, then typing pauses
 * // @@pause                    ← typing pauses after the next line
 * // @@step Add VAT             ← a step title, shown from the next line on
 * ```
 *
 * A marker is `@@` followed by a word. It is found the same way in every
 * language – `# @@pause` in Python, `<!-- @@pause -->` in HTML – because the
 * search never looks at the comment syntax, only for `@@word`. Doubling the `@`
 * is what makes it safe: `@step` is a Python decorator or a C# identifier,
 * while `@@step` is valid code in no language the app supports.
 *
 * **A line with a marker is never typed** – the whole line, whatever else is on
 * it, whether the marker is switched on or off, and even when the word after
 * `@@` is misspelled. A wrong word must not end up in a recording.
 *
 * With text after them, `@@highlight` and `@@pause` also show that text as a
 * callout. A step title is not a callout: it stays at the top, next to the
 * file name, until the next step. Every marker belongs to the next line of code.
 */

/** The markers there are. */
export const MARKERS = ['callout', 'pause', 'highlight', 'step'] as const;

/** One of {@link MARKERS}. */
export type Marker = (typeof MARKERS)[number];

/** An icon in the script labels: one per command, and a warning. */
export type LabelIcon = Marker | 'warning';

/** What every marker starts with. */
export const MARKER_PREFIX = '@@';

/**
 * `@@` and a word, not preceded by a letter, digit or `@` – so Razor's escaped
 * `info@@example.com` is not a marker. The rest of the line is the marker's text.
 */
const MARKER_PATTERN = /(?<![\w@])@@([a-z]+)(.*)$/i;

/** A line with a marker in it, as read by {@link readMarkerLine}. */
export interface MarkerLine {
  /** The marker, or null when the word after `@@` is not one – the line is hidden all the same. */
  marker: Marker | null;
  /** The word after `@@`, as written. */
  word: string;
  /** The text after the marker, without a closing `-->` or `*\/`. */
  text: string;
  /** True when the line has code before the marker – it is hidden along with the marker. */
  hidesCode: boolean;
}

/**
 * Reads a line as a marker line: `// @@pause Look here` → marker "pause",
 * text "Look here". Returns null for a line without a marker.
 */
export function readMarkerLine(line: string, syntax: CommentSyntax): MarkerLine | null {
  const match = MARKER_PATTERN.exec(line);
  if (!match) return null;

  const word = match[1];
  const known = (MARKERS as readonly string[]).includes(word.toLowerCase());
  const close = syntax.block?.[1];
  let text = match[2].trim();
  if (close && text.endsWith(close)) text = text.slice(0, -close.length).trim();

  const before = stripCommentStart(line.slice(0, match.index).trim(), syntax);
  return { marker: known ? (word.toLowerCase() as Marker) : null, word, text, hidesCode: before !== '' };
}

/** True for a line that holds nothing but a comment, like `// Explain` – not code a callout belongs to. */
export function isCommentOnly(line: string, syntax: CommentSyntax): boolean {
  const text = line.trim();
  // `#!/bin/bash` is an instruction to the system, not a comment.
  if (text.startsWith('#!')) return false;
  return [syntax.line, syntax.block?.[0]].some((start) => start !== undefined && text.startsWith(start));
}

/**
 * Drops the comment start at the end of the text before a marker: `x(); //` → `x();`,
 * `///` and `##` → nothing, and the `*` of a line inside a block comment.
 */
function stripCommentStart(before: string, syntax: CommentSyntax): string {
  let text = before;
  for (const start of [syntax.line, syntax.block?.[0], '*']) {
    while (start && text.endsWith(start)) text = text.slice(0, -start.length).replace(/\/+$/, '').trimEnd();
  }
  return text;
}

/** On or off for each marker. */
export type MarkerSwitches = Record<Marker, boolean>;

/** Every marker on – the default. */
export const ALL_MARKERS_ON: MarkerSwitches = { callout: true, highlight: true, pause: true, step: true };

/** Which markers are obeyed: none when the script is off, otherwise those switched on. */
export interface ScriptOptions {
  /** The master switch. Off: every marker is ignored. */
  enabled: boolean;
  markers: MarkerSwitches;
}

/** The script on, every marker on. */
export const DEFAULT_SCRIPT_OPTIONS: ScriptOptions = { enabled: true, markers: ALL_MARKERS_ON };

/** True when `marker` should do its job. */
export function isMarkerOn(options: ScriptOptions, marker: Marker): boolean {
  return options.enabled && options.markers[marker];
}
