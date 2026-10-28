/**
 * Splits source code into the chunks the typewriter emits one at a time.
 *
 * Leading indentation is emitted as a single chunk – a human presses Tab
 * once, they don't type eight spaces one by one. Everything else is one
 * character per chunk. Array.from keeps emoji and other surrogate pairs intact.
 * Trailing blank lines are dropped so the cursor ends on the last real line.
 */
export function tokenize(source: string): string[] {
  const lines = source.replace(/\r\n?/g, '\n').trimEnd().split('\n');
  const chunks: string[] = [];

  lines.forEach((line, index) => {
    const indent = /^[ \t]*/.exec(line)?.[0] ?? '';
    if (indent) chunks.push(indent);
    chunks.push(...Array.from(line.slice(indent.length)));

    const isLastLine = index === lines.length - 1;
    if (!isLastLine) chunks.push('\n');
  });

  return chunks;
}
