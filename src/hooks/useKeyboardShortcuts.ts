import { useEffect, useRef } from 'react';

/** Keys are KeyboardEvent.key values; single letters are matched lowercase. */
export type KeyBindings = Record<string, () => void>;

/**
 * Global shortcuts so you never have to click inside the recorded area.
 * Ignored while the user is typing (source editor, text fields), but active
 * in the read-only stage editor, which marks itself with `data-keyboard-surface`.
 */
export function useKeyboardShortcuts(bindings: KeyBindings): void {
  const bindingsRef = useRef(bindings);

  useEffect(() => {
    bindingsRef.current = bindings;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const action = bindingsRef.current[key];
      if (!action) return;

      event.preventDefault();
      event.stopPropagation();
      action();
    };

    // Capture phase so Monaco never sees the shortcut keys.
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
  }, []);
}

const NON_TEXT_INPUTS = new Set(['range', 'checkbox', 'radio', 'button']);

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest('[data-keyboard-surface]')) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLInputElement) return !NON_TEXT_INPUTS.has(target.type);
  return target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
}
