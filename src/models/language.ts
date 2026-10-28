/**
 * How comments start (and block comments end) in a language. Only used to
 * tell a comment-only line from a line of code, and to drop a closing `-->`
 * or `*\/` after a marker's text. Finding a marker never depends on it.
 */
export interface CommentSyntax {
  line?: string;
  block?: readonly [open: string, close: string];
}

const C_STYLE: CommentSyntax = { line: '//', block: ['/*', '*/'] };
const MARKUP: CommentSyntax = { block: ['<!--', '-->'] };

/**
 * Languages supported by the presenter. `id` is the Monaco language id,
 * `fileName` is what the fake editor tab shows.
 */
export const LANGUAGES = [
  { id: 'csharp', label: 'C#', fileName: 'Program.cs', comments: C_STYLE },
  { id: 'javascript', label: 'JavaScript', fileName: 'app.js', comments: C_STYLE },
  { id: 'typescript', label: 'TypeScript', fileName: 'app.ts', comments: C_STYLE },
  { id: 'python', label: 'Python', fileName: 'main.py', comments: { line: '#' } },
  { id: 'html', label: 'HTML', fileName: 'index.html', comments: MARKUP },
  { id: 'css', label: 'CSS', fileName: 'styles.css', comments: { block: ['/*', '*/'] } },
  {
    id: 'shell',
    label: 'Bash',
    fileName: 'script.sh',
    comments: { line: '#' },
  },
  {
    id: 'powershell',
    label: 'PowerShell',
    fileName: 'script.ps1',
    comments: { line: '#', block: ['<#', '#>'] },
  },
  { id: 'sql', label: 'SQL', fileName: 'query.sql', comments: { line: '--', block: ['/*', '*/'] } },
  { id: 'json', label: 'JSON', fileName: 'data.json', comments: {} },
  { id: 'xml', label: 'XML', fileName: 'config.xml', comments: MARKUP },
] as const satisfies readonly { id: string; label: string; fileName: string; comments: CommentSyntax }[];

/** One entry of {@link LANGUAGES}. */
export type Language = (typeof LANGUAGES)[number];
/** Monaco's id for a supported language, e.g. `'csharp'`. */
export type LanguageId = Language['id'];

/** Looks up a language by id. */
export function getLanguage(id: LanguageId): Language {
  // The array is typed so every LanguageId has exactly one entry.
  return LANGUAGES.find((language) => language.id === id)!;
}
