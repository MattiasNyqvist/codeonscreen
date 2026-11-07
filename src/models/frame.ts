/**
 * Colours a frame can have. Each is picked with the key of its first letter (R, G, B).
 */
export const FRAME_COLORS = ['red', 'green', 'blue'] as const;

/** One of {@link FRAME_COLORS}. */
export type FrameColor = (typeof FRAME_COLORS)[number];

/**
 * What the presenter picks: a fixed colour, or `mix` – every new frame gets a
 * different colour than the one before (key M).
 */
export const FRAME_COLOR_CHOICES = [...FRAME_COLORS, 'mix'] as const;

/** One of {@link FRAME_COLOR_CHOICES}. */
export type FrameColorChoice = (typeof FRAME_COLOR_CHOICES)[number];

/** Inclusive, 1-based line range – the same convention Monaco uses. */
export interface LineRange {
  startLine: number;
  endLine: number;
}

/**
 * The rectangle drawn around one or more lines when the presenter presses H.
 * There is at most one frame on the stage at a time.
 */
export interface Frame extends LineRange {
  /** Changes for every new frame, so React replays the drawing animation. */
  id: number;
  color: FrameColor;
}
