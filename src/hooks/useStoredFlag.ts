import { useCallback, useState } from 'react';

/**
 * A true/false preference about the app itself – not part of a project – kept
 * in localStorage: whether the control panel is open, whether help text is on, whether Presentation Mode
 * has been played once.
 *
 * Returns `[value, setValue]`, like `useState`.
 *
 * @param key - storage key, unique per flag
 * @param initial - the value until something has been stored
 */
export function useStoredFlag(key: string, initial: boolean): [value: boolean, setValue: (value: boolean) => void] {
  const [value, setValueState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      // Anything but "false" counts as true, so flags saved by older versions ("dismissed") still work.
      return stored === null ? initial : stored !== 'false';
    } catch {
      return initial;
    }
  });

  const setValue = useCallback(
    (next: boolean) => {
      setValueState(next);
      try {
        localStorage.setItem(key, String(next));
      } catch {
        // Storage blocked – the flag just lasts for this visit.
      }
    },
    [key],
  );

  return [value, setValue];
}
