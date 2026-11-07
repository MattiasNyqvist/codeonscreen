import { FRAME_COLORS, type FrameColor, type FrameColorChoice } from '../models/frame';

/**
 * The colour of the next frame.
 *
 * A fixed choice is used as is. `mix` picks at random among the colours that
 * differ from the previous frame – pure random would sometimes repeat a colour,
 * and then the new frame looks like nothing happened.
 *
 * @param previous - colour of the last frame, or null for the first one
 * @param random - injectable so tests can be deterministic; defaults to Math.random
 */
export function pickFrameColor(
  choice: FrameColorChoice,
  previous: FrameColor | null,
  random: () => number = Math.random,
): FrameColor {
  if (choice !== 'mix') return choice;

  const candidates = FRAME_COLORS.filter((color) => color !== previous);
  return candidates[Math.floor(random() * candidates.length)];
}
