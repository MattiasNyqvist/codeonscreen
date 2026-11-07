import { describe, expect, it } from 'vitest';
import { APP_VERSION, describeBuild } from './app';

describe('describeBuild', () => {
  it('shows major.minor version and build time as yymmdd.hhmm in local time', () => {
    expect(describeBuild('1.0.3', new Date(2026, 9, 3, 8, 5))).toBe('v1.0 · build 261003.0805');
  });
});

describe('APP_VERSION', () => {
  it('comes from package.json', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
