/**
 * A source comment shown as a callout bubble next to the line it explains.
 */
export interface LineHint {
  /** 1-based line in the stage editor. */
  line: number;
  text: string;
  /** Reading time left. At 0 the bubble starts fading; it is removed after the fade. */
  remainingMs: number;
}
