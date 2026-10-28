/**
 * Column arithmetic for a monospace font. Tabs jump to the next tab stop,
 * every other character is one column wide (good enough for code).
 */

/** Number of columns `text` occupies when rendered from column 0. */
export function visualWidth(text: string, tabSize: number): number {
  let columns = 0;
  for (const char of text) {
    columns = char === '\t' ? (Math.floor(columns / tabSize) + 1) * tabSize : columns + 1;
  }
  return columns;
}

/** Start and end column of the visible text, ignoring leading and trailing whitespace. */
export function textColumns(line: string, tabSize: number): { start: number; end: number } {
  const indent = /^[ \t]*/.exec(line)?.[0] ?? '';
  return {
    start: visualWidth(indent, tabSize),
    end: visualWidth(line.trimEnd(), tabSize),
  };
}
