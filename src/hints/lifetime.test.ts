import { describe, expect, it } from 'vitest';
import { FADE_MS, createHint, createSubtitle, isFading, readingTimeMs, tickHints, tickSubtitle } from './lifetime';

describe('readingTimeMs', () => {
  it('gives a typical 48-character comment 5.5 seconds', () => {
    expect(readingTimeMs('x'.repeat(48))).toBe(5500);
  });

  it('never goes below 3 or above 10 seconds', () => {
    expect(readingTimeMs('Hi')).toBe(3000);
    expect(readingTimeMs('x'.repeat(500))).toBe(10_000);
  });
});

describe('tickHints', () => {
  it('counts down, then fades, then removes', () => {
    let hints = [createHint(1, 'Hi')]; // 3000 ms

    hints = tickHints(hints, 2900);
    expect(isFading(hints[0])).toBe(false);

    hints = tickHints(hints, 200);
    expect(isFading(hints[0])).toBe(true);

    hints = tickHints(hints, FADE_MS);
    expect(hints).toEqual([]);
  });

  it('keeps the bubble on the held line, while the others run out', () => {
    const hints = tickHints([createHint(1, 'Old'), createHint(2, 'Paused here')], 10_000, 2);
    expect(hints.map((hint) => hint.line)).toEqual([2]);
    expect(isFading(hints[0])).toBe(false);
  });
});

describe('tickSubtitle', () => {
  it('counts down, then fades, then is gone', () => {
    let subtitle = createSubtitle(1, 4, 'Hi'); // 3000 ms
    subtitle = tickSubtitle(subtitle, 2900)!;
    expect(isFading(subtitle)).toBe(false);
    subtitle = tickSubtitle(subtitle, 200)!;
    expect(isFading(subtitle)).toBe(true);
    expect(tickSubtitle(subtitle, FADE_MS)).toBeNull();
  });

  it('keeps the subtitle while typing waits at its line', () => {
    const subtitle = createSubtitle(1, 4, 'Hi');
    expect(tickSubtitle(subtitle, 10_000, 4)).toBe(subtitle);
    expect(tickSubtitle(subtitle, 10_000, 5)).toBeNull();
  });
});
