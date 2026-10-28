import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, cycle, parseSettings } from './settings';

describe('parseSettings', () => {
  it('returns the defaults for nothing stored', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid values and replaces only the invalid ones', () => {
    const result = parseSettings({ speed: 60, frameColor: 'yellow', theme: 'light' });
    expect(result.speed).toBe(60);
    expect(result.frameColor).toBe(DEFAULT_SETTINGS.frameColor);
    expect(result.theme).toBe('light');
  });

  it('rejects numbers outside their range', () => {
    expect(parseSettings({ soundLevel: 9 }).soundLevel).toBe(DEFAULT_SETTINGS.soundLevel);
    expect(parseSettings({ spotlightRadius: 5 }).spotlightRadius).toBe(DEFAULT_SETTINGS.spotlightRadius);
  });

  it('defaults to landscape with line numbers', () => {
    const result = parseSettings({ format: 'square' });
    expect(result.format).toBe('landscape');
    expect(result.lineNumbers).toBe(true);
  });

  it('accepts mix as frame colour', () => {
    expect(parseSettings({ frameColor: 'mix' }).frameColor).toBe('mix');
  });
});

describe('cycle', () => {
  it('moves to the next option and wraps around', () => {
    expect(cycle(['a', 'b', 'c'], 'b')).toBe('c');
    expect(cycle(['a', 'b', 'c'], 'c')).toBe('a');
  });

  it('keeps each marker switch on its own, defaulting to on', () => {
    const { markers } = parseSettings({ markers: { pause: false, step: 'yes' } });
    expect(markers).toEqual({ callout: true, highlight: true, pause: false, step: true });
  });
});
