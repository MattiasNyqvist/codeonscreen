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

/**
 * A subtitle: text at the bottom of the screen, like on TV. One at a time – a new one replaces the old.
 */
export interface Subtitle {
  /** Tells subtitles apart, so a new one fades in even when the text is the same. */
  id: number;
  /** 1-based line in the stage editor whose typing it follows – it is held while typing waits at that line. */
  line: number;
  text: string;
  /** Reading time left. At 0 the subtitle starts fading; it is removed after the fade. */
  remainingMs: number;
}

/**
 * A step title card: shown in the middle of the screen while typing waits.
 */
export interface StepCard {
  /** Tells cards apart, so the animation restarts for each one. */
  id: number;
  title: string;
}
