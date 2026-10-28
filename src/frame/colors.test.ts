import { describe, expect, it } from 'vitest';
import { pickFrameColor } from './colors';

describe('pickFrameColor', () => {
  it('uses a fixed colour as is', () => {
    expect(pickFrameColor('green', 'green')).toBe('green');
  });

  it('never repeats the previous colour in mix mode', () => {
    for (const value of [0, 0.4, 0.99]) {
      expect(pickFrameColor('mix', 'red', () => value)).not.toBe('red');
    }
  });

  it('can pick any colour for the first frame', () => {
    expect(pickFrameColor('mix', null, () => 0)).toBe('red');
    expect(pickFrameColor('mix', null, () => 0.99)).toBe('blue');
  });
});
