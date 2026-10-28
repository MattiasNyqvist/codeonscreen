/**
 * Texts that mention keys write them in square brackets: "Press [H] to …".
 * {@link splitKeys} cuts such a text into plain parts and key parts, so the UI
 * can draw every key the same way – as a key cap, like in the keyboard guide.
 */

/** A run of plain text, or one key. */
export type TextPart = { kind: 'text'; text: string } | { kind: 'key'; key: string };

/** `[` + anything but brackets or spaces + `]`. "[Space]" and "[?]" are keys; "[a b]" is not. */
const KEY_PATTERN = /\[([^[\]\s]+)\]/g;

/** "Press [H] now" → text "Press ", key "H", text " now". */
export function splitKeys(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(KEY_PATTERN)) {
    if (match.index > last) parts.push({ kind: 'text', text: text.slice(last, match.index) });
    parts.push({ kind: 'key', key: match[1] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ kind: 'text', text: text.slice(last) });
  return parts;
}

/** The text as a person reads it: "Press [H]" → "Press H". Used to measure length. */
export function plainText(text: string): string {
  return text.replace(KEY_PATTERN, '$1');
}
