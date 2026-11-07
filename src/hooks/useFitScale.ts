import { useEffect, useState } from 'react';

/**
 * Scale factor that fits a fixed-size box into the window, never above 1.
 * At exactly the box size the stage is drawn 1:1, which is what a recording wants.
 *
 * The window size is the state; the scale is derived from it on every render,
 * so a new box size (another format) takes effect at once.
 */
export function useFitScale(width: number, height: number): number {
  const [windowSize, setWindowSize] = useState(readWindowSize);

  useEffect(() => {
    const update = () => setWindowSize(readWindowSize());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return Math.min(1, windowSize.width / width, windowSize.height / height);
}

function readWindowSize() {
  return { width: window.innerWidth, height: window.innerHeight };
}
