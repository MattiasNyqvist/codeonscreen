import { describe, expect, it } from 'vitest';
import { APP_VERSION, describeBuild } from './app';

describe('describeBuild', () => {
  it('shows version, date and time in local time', () => {
    expect(describeBuild('0.1.0', new Date(2026, 9, 3, 8, 5))).toBe('v0.1.0 · build 2026-10-03 08:05');
  });
});

describe('APP_VERSION', () => {
  it('comes from package.json', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
