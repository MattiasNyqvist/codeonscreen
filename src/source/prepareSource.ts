import type { CommentSyntax } from '../models/language';
import type { ScriptOptions } from '../models/script';
import { extractScript, type ExtractedScript } from './extractScript';

/** What the typewriter plays: the code, and the script's callouts, highlights, pauses and steps by line. */
export type PreparedSource = ExtractedScript;

/**
 * Turns pasted source into what the typewriter plays. The script markers are
 * read out of it (see {@link extractScript}); leading blank lines are dropped, so
 * typing starts on the first line with content, and every line number moves with them.
 */
export function prepareSource(source: string, syntax: CommentSyntax, options: ScriptOptions): PreparedSource {
  const script = extractScript(source, syntax, options);
  const code = script.code.replace(/^\n+/, '');
  const shift = code.length - script.code.length; // zero or negative: one per removed line

  return {
    code,
    hints: new Map([...script.hints].map(([line, text]) => [line + shift, text])),
    highlights: new Set([...script.highlights].map((line) => line + shift)),
    pauses: new Set([...script.pauses].map((line) => line + shift)),
    steps: new Map([...script.steps].map(([line, title]) => [line + shift, title])),
  };
}
