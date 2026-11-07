import type { Ref } from 'react';
import type { FrameColor } from '../../models/frame';

/** Props for {@link FrameOutline}. */
export interface FrameOutlineProps {
  ref?: Ref<HTMLDivElement>;
  color: FrameColor;
}

/**
 * Four edges that draw themselves one after another, clockwise, in one second
 * (see `.frame-outline` in app.css). Position and size are set by `CodeStage`.
 */
export function FrameOutline({ ref, color }: FrameOutlineProps) {
  return (
    <div ref={ref} className={`frame-outline frame-outline--${color}`}>
      <span className="frame-outline__edge frame-outline__edge--top" />
      <span className="frame-outline__edge frame-outline__edge--right" />
      <span className="frame-outline__edge frame-outline__edge--bottom" />
      <span className="frame-outline__edge frame-outline__edge--left" />
    </div>
  );
}
