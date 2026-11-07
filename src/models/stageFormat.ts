/**
 * The two shapes a recording can have.
 *
 * - `landscape` – 16:9 for YouTube and other wide screens
 * - `portrait` – 9:16 for TikTok, Instagram Reels and YouTube Shorts
 */
export const STAGE_FORMATS = ['landscape', 'portrait'] as const;

/** One of {@link STAGE_FORMATS}. */
export type StageFormat = (typeof STAGE_FORMATS)[number];

/** Everything that differs between the formats, in one place. */
export interface StageLayout {
  /** Size of the recorded area in pixels. */
  width: number;
  height: number;
  /** Code font size and line height in pixels. */
  fontSize: number;
  lineHeight: number;
  /**
   * Where comment bubbles go. `beside-line` puts each bubble just after the end
   * of its line. A phone screen has no width for that, so portrait shows them as
   * `captions` below the code.
   */
  bubbles: 'beside-line' | 'captions';
}

/**
 * The layouts. A portrait recording is shown about 400 points wide on a phone, so
 * its 1080 pixels shrink to roughly a third – the font is half again as large
 * to stay readable, which leaves room for about 50 characters per line.
 */
export const STAGE_LAYOUTS: Record<StageFormat, StageLayout> = {
  landscape: { width: 1920, height: 1080, fontSize: 20, lineHeight: 32, bubbles: 'beside-line' },
  portrait: { width: 1080, height: 1920, fontSize: 30, lineHeight: 46, bubbles: 'captions' },
};

/** Labels for the format switch. Developers think in platforms, so those come first. */
export const STAGE_FORMAT_LABELS: Record<StageFormat, string> = {
  landscape: '16:9 · YouTube',
  portrait: '9:16 · TikTok · Reels',
};
