import { describe, expect, it } from 'vitest';
import { plainText, splitKeys } from './keyText';

describe('splitKeys', () => {
  it('cuts a text into plain parts and keys', () => {
    expect(splitKeys('Press [H] now')).toEqual([
      { kind: 'text', text: 'Press ' },
      { kind: 'key', key: 'H' },
      { kind: 'text', text: ' now' },
    ]);
  });

  it('handles keys next to each other, at the edges, and with symbols', () => {
    expect(splitKeys('[R] [G][?]')).toEqual([
      { kind: 'key', key: 'R' },
      { kind: 'text', text: ' ' },
      { kind: 'key', key: 'G' },
      { kind: 'key', key: '?' },
    ]);
  });

  it('leaves brackets with spaces alone', () => {
    expect(splitKeys('an [array of] things')).toEqual([{ kind: 'text', text: 'an [array of] things' }]);
  });
});

describe('plainText', () => {
  it('drops the brackets', () => {
    expect(plainText('Press [Space], then [Esc]')).toBe('Press Space, then Esc');
  });
});
