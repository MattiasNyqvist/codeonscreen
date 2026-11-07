import { describe, expect, it } from 'vitest';
import { BACKSPACE, typeKey } from '../models/keystroke';
import { planKeystrokes } from './typos';

/** A fake random source that returns the given values in order. */
function sequence(...values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length];
}

describe('planKeystrokes', () => {
  it('types every chunk once when typos are off', () => {
    expect(planKeystrokes(['a', 'b'])).toEqual([typeKey('a'), typeKey('b')]);
  });

  it('inserts a neighbouring wrong key and corrects it with backspace', () => {
    // 0 → always mistype, 0 → pick the first neighbour of "e" ("w")
    const result = planKeystrokes(['t', 'e'], 1, sequence(0, 0));
    expect(result).toEqual([typeKey('t'), typeKey('w'), BACKSPACE, typeKey('e')]);
  });

  it('never mistypes the first letter of a word or non-letters', () => {
    const result = planKeystrokes([' ', 'a', ';'], 1, sequence(0));
    expect(result).toEqual([typeKey(' '), typeKey('a'), typeKey(';')]);
  });

  it('keeps upper case', () => {
    const result = planKeystrokes(['x', 'E'], 1, sequence(0, 0));
    expect(result[1]).toEqual(typeKey('W'));
  });
});
