import type { LineRange } from '../models/frame';

/**
 * The nearest line above `line` that has content, or null at the top.
 * Used to grow a frame upwards one meaningful line per key press.
 */
export function previousContentLine(line: number, isBlank: (line: number) => boolean): number | null {
  for (let candidate = line - 1; candidate >= 1; candidate--) {
    if (!isBlank(candidate)) return candidate;
  }
  return null;
}

/** The lines in 1..lineCount that are not inside `range` – the ones that get dimmed. */
export function linesOutside(range: LineRange, lineCount: number): LineRange[] {
  const outside: LineRange[] = [];
  if (range.startLine > 1) outside.push({ startLine: 1, endLine: range.startLine - 1 });
  if (range.endLine < lineCount) outside.push({ startLine: range.endLine + 1, endLine: lineCount });
  return outside;
}
