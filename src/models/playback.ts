/**
 * Where the typing animation is.
 *
 * - `idle` – nothing typed, editor empty
 * - `playing` – typing in progress
 * - `paused` – stopped mid-way, the presenter may frame and zoom
 * - `finished` – everything typed
 *
 * A string union instead of several booleans (`isPlaying`, `isPaused` …) makes
 * impossible combinations impossible to express.
 */
export type PlaybackState = 'idle' | 'playing' | 'paused' | 'finished';

/** Typing speed in characters per second. */
export const SPEED_LIMITS = {
  min: 5,
  max: 120,
  default: 30,
} as const;

/** A word for a speed band, shown next to the speed slider. */
export type SpeedName = 'slow' | 'normal' | 'fast';

/** A word for any speed, so the number means something at a glance. */
export function describeSpeed(charsPerSecond: number): SpeedName {
  if (charsPerSecond < 20) return 'slow';
  if (charsPerSecond <= 50) return 'normal';
  return 'fast';
}
