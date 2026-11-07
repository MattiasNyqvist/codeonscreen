import { useEffect, useRef, type CSSProperties, type RefObject } from 'react';
import type { PointerMode } from '../../models/settings';

/** Hide the pointer this long after the mouse stops, so it never lingers on screen. */
const IDLE_HIDE_MS = 1500;

/** Props for {@link PointerOverlay}. */
export interface PointerOverlayProps {
  mode: PointerMode;
  /** Radius of the clear circle in spotlight mode, in stage pixels. */
  spotlightRadius: number;
  /** The fixed-size stage element; mouse positions are converted into its coordinates. */
  stageRef: RefObject<HTMLDivElement | null>;
}

/**
 * A laser dot or a spotlight that follows the mouse over the stage.
 *
 * - Laser: a glowing dot – points at something without hiding anything.
 * - Spotlight: darkens everything except a circle around the mouse.
 *
 * Both appear when the mouse moves and fade out shortly after it stops.
 * The position is written to CSS variables directly, so moving the mouse
 * never re-renders React.
 */
export function PointerOverlay({ mode, spotlightRadius, stageRef }: PointerOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === 'off') return;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const onMove = (event: PointerEvent) => {
      const stage = stageRef.current;
      const overlay = overlayRef.current;
      if (!stage || !overlay) return;

      // The stage may be scaled down to fit the window; convert to stage pixels.
      const bounds = stage.getBoundingClientRect();
      const scale = bounds.width / stage.offsetWidth;
      overlay.style.setProperty('--pointer-x', `${(event.clientX - bounds.left) / scale}px`);
      overlay.style.setProperty('--pointer-y', `${(event.clientY - bounds.top) / scale}px`);
      overlay.classList.add('pointer-overlay--visible');

      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => overlay.classList.remove('pointer-overlay--visible'), IDLE_HIDE_MS);
    };

    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('pointermove', onMove);
      clearTimeout(hideTimer);
    };
  }, [mode, stageRef]);

  if (mode === 'off') return null;
  return (
    <div
      ref={overlayRef}
      className={`pointer-overlay pointer-overlay--${mode}`}
      style={{ '--spotlight-radius': `${spotlightRadius}px` } as CSSProperties}
      aria-hidden="true"
    />
  );
}
