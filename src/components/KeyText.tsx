import { splitKeys } from '../models/keyText';

/** Props for {@link KeyText}. */
export interface KeyTextProps {
  /** Text with keys in square brackets, e.g. "Press [H] to highlight". */
  text: string;
}

/** Renders a text with every `[Key]` drawn as a key cap – the same look as in the keyboard guide. */
export function KeyText({ text }: KeyTextProps) {
  return (
    <>
      {splitKeys(text).map((part, index) =>
        part.kind === 'key' ? <kbd key={index}>{part.key}</kbd> : <span key={index}>{part.text}</span>,
      )}
    </>
  );
}
