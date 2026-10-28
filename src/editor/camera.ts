/**
 * Camera math for the zoom effect. Pure functions in pixels – no Monaco here,
 * so the behaviour is easy to test and tweak.
 *
 * The camera is a CSS transform on the element wrapping the editor:
 *   transform-origin: 0 0; transform: translate(x, y) scale(scale)
 */
/** A camera position: translate by (x, y) pixels, then scale. */
export interface CameraTransform {
  x: number;
  y: number;
  scale: number;
}

/** A box in editor pixels, relative to the editor's top-left corner. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The visible size of the editor in pixels. */
export interface Viewport {
  width: number;
  height: number;
}

/** The camera at rest: no zoom, no offset. */
export const IDENTITY: CameraTransform = { x: 0, y: 0, scale: 1 };

const MAX_SCALE = 1.6;
/** Share of the available width the focused line may fill after zooming. */
const FIT_RATIO = 0.85;

/**
 * Zooms in on `focus` and centres it in the viewport. The edges are clamped so
 * the camera never shows empty space outside the editor.
 */
export function focusCamera(focus: Rect, viewport: Viewport): CameraTransform {
  const fitX = focus.width > 0 ? (viewport.width * FIT_RATIO) / focus.width : MAX_SCALE;
  const fitY = focus.height > 0 ? (viewport.height * FIT_RATIO) / focus.height : MAX_SCALE;
  const scale = clamp(Math.min(fitX, fitY), 1, MAX_SCALE);

  const centerX = focus.x + focus.width / 2;
  const centerY = focus.y + focus.height / 2;

  return {
    x: clamp(viewport.width / 2 - centerX * scale, viewport.width * (1 - scale), 0),
    y: clamp(viewport.height / 2 - centerY * scale, viewport.height * (1 - scale), 0),
    scale,
  };
}

/** Where a y coordinate inside the editor ends up on screen after the camera transform. */
export function project(y: number, camera: CameraTransform): number {
  return y * camera.scale + camera.y;
}

/** Where an x coordinate inside the editor ends up on screen after the camera transform. */
export function projectX(x: number, camera: CameraTransform): number {
  return x * camera.scale + camera.x;
}

/** Blend between two cameras; `t` runs from 0 (from) to 1 (to). */
export function interpolate(from: CameraTransform, to: CameraTransform, t: number): CameraTransform {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    scale: from.scale + (to.scale - from.scale) * t,
  };
}

/** Fast start, gentle stop – reads as a camera move rather than a jump. */
export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** The camera as a CSS `transform` value (applied with `transform-origin: 0 0`). */
export function toCssTransform(camera: CameraTransform): string {
  return `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
