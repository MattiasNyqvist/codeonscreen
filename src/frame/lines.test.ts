import { describe, expect, it } from 'vitest';
import { linesOutside, previousContentLine } from './lines';

describe('previousContentLine', () => {
  it('skips blank lines and stops at the top', () => {
    const blank = new Set([3, 4]);
    expect(previousContentLine(5, (line) => blank.has(line))).toBe(2);
    expect(previousContentLine(1, () => false)).toBeNull();
  });
});

describe('linesOutside', () => {
  it('returns the lines above and below the range', () => {
    expect(linesOutside({ startLine: 3, endLine: 4 }, 6)).toEqual([
      { startLine: 1, endLine: 2 },
      { startLine: 5, endLine: 6 },
    ]);
  });

  it('returns nothing when the range covers everything', () => {
    expect(linesOutside({ startLine: 1, endLine: 4 }, 4)).toEqual([]);
  });
});
