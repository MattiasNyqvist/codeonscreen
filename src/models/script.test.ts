import { describe, expect, it } from 'vitest';
import { getLanguage } from './language';
import { isCommentOnly, readMarkerLine } from './script';

const csharp = getLanguage('csharp').comments;
const html = getLanguage('html').comments;

describe('readMarkerLine', () => {
  it('reads a marker and the text after it', () => {
    expect(readMarkerLine('// @@callout Look at this', csharp)).toEqual({
      marker: 'callout',
      word: 'callout',
      text: 'Look at this',
      hidesCode: false,
    });
    expect(readMarkerLine('  # @@Pause', csharp)?.marker).toBe('pause');
  });

  it('drops a closing comment marker from the text', () => {
    expect(readMarkerLine('<!-- @@step Layout -->', html)?.text).toBe('Layout');
  });

  it('knows when the line has code before the marker', () => {
    expect(readMarkerLine('x(); // @@pause', csharp)?.hidesCode).toBe(true);
    expect(readMarkerLine(' * @@pause', csharp)?.hidesCode).toBe(false);
  });

  it('reads an unknown word as a marker line without a marker', () => {
    expect(readMarkerLine('// @@chapter One', csharp)).toMatchObject({ marker: null, word: 'chapter' });
  });

  it('returns null for a line without a marker', () => {
    expect(readMarkerLine('// @callout single at', csharp)).toBeNull();
    expect(readMarkerLine('mail("me@@pause.se")', csharp)).toBeNull();
    expect(readMarkerLine('@@ -1,3 +1,4 @@', csharp)).toBeNull();
  });
});

describe('isCommentOnly', () => {
  it('tells a comment line from code', () => {
    expect(isCommentOnly('  // note', csharp)).toBe(true);
    expect(isCommentOnly('x(); // note', csharp)).toBe(false);
    expect(isCommentOnly('#!/bin/bash', getLanguage('shell').comments)).toBe(false);
  });
});
