import { describe, expect, it } from 'vitest';
import { bubbleLeft, stackBubbles } from './stackBubbles';

describe('stackBubbles', () => {
  it('centres a lone bubble on its line', () => {
    expect(stackBubbles([{ anchorY: 200, height: 60 }])).toEqual([{ top: 170, arrowY: 30 }]);
  });

  it('pushes a bubble down when it would overlap the one above', () => {
    const [first, second] = stackBubbles([
      { anchorY: 100, height: 60 },
      { anchorY: 120, height: 60 },
    ]);
    expect(first.top).toBe(70);
    expect(second.top).toBe(140); // 70 + 60 + 10 gap
    expect(second.arrowY).toBe(16); // arrow slides to the top to point back up at its line
  });

  it('returns placements in input order even when anchors are unsorted', () => {
    const [low, high] = stackBubbles([
      { anchorY: 500, height: 40 },
      { anchorY: 100, height: 40 },
    ]);
    expect(high.top).toBe(80);
    expect(low.top).toBe(480);
  });
});

describe('bubbleLeft', () => {
  it('sits the gap after the end of the line', () => {
    expect(bubbleLeft(500, 60, 300, 1920)).toBe(560);
  });

  it('moves left so a bubble after a long line still fits', () => {
    expect(bubbleLeft(1800, 60, 300, 1920)).toBe(1920 - 24 - 300);
  });

  it('never goes past the left edge', () => {
    expect(bubbleLeft(10, 0, 3000, 1920)).toBe(24);
  });
});
