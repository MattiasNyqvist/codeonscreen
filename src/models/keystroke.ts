/**
 * One step of the typing animation: either text that appears, or a backspace
 * that removes the last character (used to correct a simulated typo).
 */
export type Keystroke = { kind: 'type'; text: string } | { kind: 'backspace' };

/** A keystroke that types `text`. */
export const typeKey = (text: string): Keystroke => ({ kind: 'type', text });

/** The keystroke that removes the last character. */
export const BACKSPACE: Keystroke = { kind: 'backspace' };

/** True for the keystroke that starts a new line. */
export function isLineBreak(keystroke: Keystroke): boolean {
  return keystroke.kind === 'type' && keystroke.text === '\n';
}
