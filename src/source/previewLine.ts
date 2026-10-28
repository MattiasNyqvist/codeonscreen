import type { CommentSyntax } from '../models/language';
import { isCommentOnly, readMarkerLine } from '../models/script';

/** Longest line the typing preview shows; it is a taste, not a recording. */
export const MAX_PREVIEW_LENGTH = 44;

/** Typed when the editor holds no code yet. */
export const FALLBACK_PREVIEW = 'print("Hello, viewers!")';

/**
 * The line the typing preview types: the first line of the user's own code –
 * so the preview looks like their tutorial, not like a sample. Blank lines,
 * comment-only lines and marker lines are skipped, and a long line is cut at a
 * word boundary.
 */
export function previewLine(source: string, syntax: CommentSyntax): string {
  const line = source
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((text) => text.trim())
    .find((text) => text !== '' && !isCommentOnly(text, syntax) && readMarkerLine(text, syntax) === null);

  if (!line) return FALLBACK_PREVIEW;
  if (line.length <= MAX_PREVIEW_LENGTH) return line;

  const cut = line.slice(0, MAX_PREVIEW_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  return lastSpace > MAX_PREVIEW_LENGTH / 2 ? cut.slice(0, lastSpace) : cut;
}
