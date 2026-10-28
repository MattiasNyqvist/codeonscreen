import { describe, expect, it } from 'vitest';
import { CONTROL_HINTS, MAX_HINT_LENGTH } from './controlHints';
import { plainText } from './keyText';

describe('CONTROL_HINTS', () => {
  it.each(Object.entries(CONTROL_HINTS))('%s fits a tooltip', (_, text) => {
    expect(plainText(text).length).toBeLessThanOrEqual(MAX_HINT_LENGTH);
  });
});
