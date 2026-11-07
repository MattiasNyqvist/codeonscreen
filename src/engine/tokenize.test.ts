import { describe, expect, it } from 'vitest';
import { tokenize } from './tokenize';

describe('tokenize', () => {
  it('emits indentation as one chunk and the rest char by char', () => {
    expect(tokenize('if (x)\n    y;')).toEqual(['i', 'f', ' ', '(', 'x', ')', '\n', '    ', 'y', ';']);
  });

  it('normalizes Windows line endings', () => {
    expect(tokenize('a\r\nb')).toEqual(['a', '\n', 'b']);
  });

  it('drops trailing blank lines', () => {
    expect(tokenize('a\n\n')).toEqual(['a']);
  });
});
