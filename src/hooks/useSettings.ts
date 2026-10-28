import { useCallback, useEffect, useState } from 'react';
import { parseSettings, type Settings } from '../models/settings';

const STORAGE_KEY = 'code-on-screen.settings';

/**
 * The presenter's settings, saved in localStorage so a reload loses nothing.
 * Returns the current settings and a function that changes some of them.
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => parseSettings(readStorage()));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage full or blocked (private mode) – the app still works, it just won't remember.
    }
  }, [settings]);

  const update = useCallback((changes: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...changes }));
  }, []);

  return [settings, update] as const;
}

function readStorage(): unknown {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}
