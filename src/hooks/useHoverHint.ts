import { useState, type FocusEvent, type PointerEvent } from 'react';
import { CONTROL_HINTS, type HintId } from '../models/controlHints';

/** The control being pointed at or focused. */
export interface ActiveHint {
  id: HintId;
  /** The element marked with `data-hint` – the tooltip is placed next to it. */
  anchor: Element;
}

/** What {@link useHoverHint} gives back. */
export interface HoverHint {
  /** The control being pointed at or focused, or null. */
  hint: ActiveHint | null;
  /** Spread onto the element that contains the controls. */
  handlers: {
    /** Pointing at a control shows its tooltip; pointing at the space between hides it. */
    onPointerOver(event: PointerEvent): void;
    /** Leaving the whole area hides the tooltip. */
    onPointerLeave(): void;
    /** Tabbing to a control shows its tooltip too – it must work without a mouse. */
    onFocus(event: FocusEvent): void;
    /** Tabbing out of the area hides the tooltip. */
    onBlur(event: FocusEvent): void;
  };
}

/**
 * Tracks which control the user is pointing at, for the tooltips.
 *
 * Event delegation: instead of handlers on every control, one set on the
 * container reads `data-hint` from the nearest marked ancestor of the event
 * target. Adding a control means adding one attribute, nothing else.
 */
export function useHoverHint(): HoverHint {
  const [hint, setHint] = useState<ActiveHint | null>(null);

  const showFrom = (target: EventTarget | null) => {
    const anchor = hintAnchorOf(target);
    // Same control as before: keep the object, so React does not re-render and restart the fade-in.
    setHint((current) => {
      if (!anchor) return null;
      if (current?.anchor === anchor) return current;
      return { id: anchor.getAttribute('data-hint') as HintId, anchor };
    });
  };

  return {
    hint,
    handlers: {
      onPointerOver: (event) => showFrom(event.target),
      onPointerLeave: () => setHint(null),
      onFocus: (event) => showFrom(event.target),
      onBlur: (event) => {
        if (!hintIdOf(event.relatedTarget)) setHint(null);
      },
    },
  };
}

/** The nearest ancestor marked with a known `data-hint`, if any. */
function hintAnchorOf(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null;
  const anchor = target.closest('[data-hint]');
  const id = anchor?.getAttribute('data-hint');
  return anchor && id && id in CONTROL_HINTS ? anchor : null;
}

/** The `data-hint` of the nearest marked ancestor, if it names a known hint. */
export function hintIdOf(target: EventTarget | null): HintId | null {
  return (hintAnchorOf(target)?.getAttribute('data-hint') as HintId | undefined) ?? null;
}
