import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ActiveHint } from '../../hooks/useHoverHint';
import { CONTROL_HINTS } from '../../models/controlHints';
import { KeyText } from '../KeyText';

/** Space between the control and the tooltip. */
const GAP = 8;
/** The tooltip never comes closer to the window edge than this. */
const EDGE = 8;
/** Where the arrow points, measured from the control's left edge – about the middle of a switch or a label's start. */
const ARROW_OFFSET = 18;

/**
 * The explanation of one control, right next to it: below, or above when there
 * is no room below. It fades in after a short moment (CSS), so moving the mouse
 * across the panel does not set off a flicker of tooltips.
 *
 * Placed in `document.body` with fixed coordinates, so no panel or card can clip it.
 */
export function HintTooltip({ hint }: { hint: ActiveHint }) {
  const ref = useRef<HTMLDivElement>(null);

  // Measured before paint and written straight to the element – no extra render, no jump.
  useLayoutEffect(() => {
    const tip = ref.current;
    if (!tip) return;
    const anchor = hint.anchor.getBoundingClientRect();
    const size = tip.getBoundingClientRect();

    const above = anchor.bottom + GAP + size.height > window.innerHeight - EDGE;
    const top = above ? anchor.top - GAP - size.height : anchor.bottom + GAP;
    const left = Math.min(Math.max(anchor.left, EDGE), window.innerWidth - size.width - EDGE);
    const arrow = Math.min(Math.max(anchor.left + ARROW_OFFSET - left, 12), size.width - 12);

    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;
    tip.style.setProperty('--arrow-x', `${arrow}px`);
    tip.classList.toggle('hint-tooltip--above', above);
  }, [hint]);

  return createPortal(
    <div ref={ref} className="hint-tooltip" role="tooltip" aria-live="polite">
      <KeyText text={CONTROL_HINTS[hint.id]} />
    </div>,
    document.body,
  );
}
