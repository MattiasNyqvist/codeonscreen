import { describe, expect, it } from 'vitest';
import { textColumns, visualWidth } from './textMetrics';

describe('visualWidth', () => {
  it('counts characters and expands tabs to the next stop', () => {
    expect(visualWidth('abc', 4)).toBe(3);
    expect(visualWidth('\tx', 4)).toBe(5);
    expect(visualWidth('ab\tx', 4)).toBe(5);
  });
});

describe('textColumns', () => {
  it('measures the visible text of an indented line', () => {
    expect(textColumns('    return x;  ', 4)).toEqual({ start: 4, end: 13 });
  });
});
