import { describe, expect, it } from 'vitest';
import { getLanguage } from '../models/language';
import { FALLBACK_PREVIEW, MAX_PREVIEW_LENGTH, previewLine } from './previewLine';

const csharp = getLanguage('csharp').comments;

describe('previewLine', () => {
  it('takes the first line with code, skipping blank, comment-only and marker lines', () => {
    expect(previewLine('\n// Explain\nz(); // @@pause\n  var x = 1;\ny();', csharp)).toBe('var x = 1;');
  });

  it('falls back to a sample when there is no code', () => {
    expect(previewLine('// only a comment\n', csharp)).toBe(FALLBACK_PREVIEW);
  });

  it('cuts a long line at a word boundary', () => {
    const line = previewLine('Console.WriteLine("This sentence is far too long for a preview");', csharp);
    expect(line.length).toBeLessThanOrEqual(MAX_PREVIEW_LENGTH);
    expect(line.endsWith(' ')).toBe(false);
  });
});
