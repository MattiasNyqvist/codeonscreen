/** Minimum distance from the arrow to the bubble's top or bottom edge. */
const ARROW_INSET = 16;
const GAP = 10;

/** Where a bubble wants to be and how tall it is. */
export interface BubbleAnchor {
  /** Screen y of the middle of the line the bubble explains. */
  anchorY: number;
  height: number;
}

/** Where a bubble ends up. */
export interface BubblePlacement {
  top: number;
  /** Arrow position measured from the bubble's top edge. */
  arrowY: number;
}

/**
 * Places bubbles without vertical overlap. Each bubble is centred on its
 * line if there is room; otherwise it is pushed down below the previous one,
 * and its arrow slides up so it still points at the right line.
 * Returns placements in the same order as `anchors`.
 */
export function stackBubbles(anchors: readonly BubbleAnchor[]): BubblePlacement[] {
  const order = anchors.map((_, index) => index).sort((a, b) => anchors[a].anchorY - anchors[b].anchorY);
  const placements: BubblePlacement[] = new Array(anchors.length);
  let previousBottom = -Infinity;

  for (const index of order) {
    const { anchorY, height } = anchors[index];
    const top = Math.max(anchorY - height / 2, previousBottom + GAP);
    const arrowY = Math.min(Math.max(anchorY - top, ARROW_INSET), height - ARROW_INSET);

    placements[index] = { top, arrowY };
    previousBottom = top + height;
  }

  return placements;
}

/** How far a bubble may come to the stage's right edge. */
const EDGE_MARGIN = 24;

/**
 * Left edge of a bubble that sits `gap` pixels after the end of its line.
 * If that would push it past the right edge, it moves left until it fits –
 * a bubble over a little code beats a bubble that is cut off.
 */
export function bubbleLeft(lineEndX: number, gap: number, bubbleWidth: number, containerWidth: number): number {
  const fitsAt = containerWidth - EDGE_MARGIN - bubbleWidth;
  return Math.max(EDGE_MARGIN, Math.min(lineEndX + gap, fitsAt));
}
