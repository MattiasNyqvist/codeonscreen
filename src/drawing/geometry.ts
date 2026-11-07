import type { FrameColor } from '../models/frame';

/** The things that can be drawn: C circle, S square (box), A arrow, L line. */
export const SHAPE_KINDS = ['circle', 'box', 'arrow', 'line'] as const;

/** One of {@link SHAPE_KINDS}. */
export type ShapeKind = (typeof SHAPE_KINDS)[number];

/** A point in stage pixels (1920×1080 or 1080×1920), not screen pixels. */
export interface Point {
  x: number;
  y: number;
}

/**
 * One drawn shape. A circle and a box are given by two opposite corners of their bounding box; an
 * arrow runs from the first point to the second, and the head is at the second. A line is an arrow
 * without the head.
 */
export interface Shape {
  id: number;
  kind: ShapeKind;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: FrameColor;
  /** Text in the shape (a label next to an arrow). Empty for none. */
  text: string;
}

/** The drag handles of a selected shape: eight around a box or circle, two ends on an arrow or line. */
export type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'start' | 'end';

/** How close, in stage pixels, a click has to be to a line to count as a hit. */
export const HIT_TOLERANCE = 14;

/** A shape smaller than this (in stage pixels) is a stray click, not a drawing, and is dropped. */
export const MIN_SIZE = 10;

/** An arrow or a line: a shape that is one segment between two points, not a box. */
export function isSegment(shape: Shape): boolean {
  return shape.kind === 'arrow' || shape.kind === 'line';
}

/** The bounding box of a shape, always with `left <= right` and `top <= bottom`. */
export function boundsOf(shape: Shape) {
  return {
    left: Math.min(shape.x1, shape.x2),
    top: Math.min(shape.y1, shape.y2),
    right: Math.max(shape.x1, shape.x2),
    bottom: Math.max(shape.y1, shape.y2),
  };
}

/** True when the shape is too small to keep. */
export function isTooSmall(shape: Shape): boolean {
  const { left, top, right, bottom } = boundsOf(shape);
  const width = right - left;
  const height = bottom - top;
  return isSegment(shape) ? Math.hypot(width, height) < MIN_SIZE : Math.max(width, height) < MIN_SIZE;
}

/** The centre of the shape's text: the middle of a box or circle, just above the middle of an arrow or line. */
export function textAnchor(shape: Shape): Point {
  const { left, top, right, bottom } = boundsOf(shape);
  const centre = { x: (left + right) / 2, y: (top + bottom) / 2 };
  return isSegment(shape) ? { x: (shape.x1 + shape.x2) / 2, y: (shape.y1 + shape.y2) / 2 - 28 } : centre;
}

/** The handles of a shape and where they are. */
export function handlesOf(shape: Shape): { id: HandleId; at: Point }[] {
  if (isSegment(shape)) {
    return [
      { id: 'start', at: { x: shape.x1, y: shape.y1 } },
      { id: 'end', at: { x: shape.x2, y: shape.y2 } },
    ];
  }
  const { left, top, right, bottom } = boundsOf(shape);
  const midX = (left + right) / 2;
  const midY = (top + bottom) / 2;
  return [
    { id: 'nw', at: { x: left, y: top } },
    { id: 'n', at: { x: midX, y: top } },
    { id: 'ne', at: { x: right, y: top } },
    { id: 'e', at: { x: right, y: midY } },
    { id: 'se', at: { x: right, y: bottom } },
    { id: 's', at: { x: midX, y: bottom } },
    { id: 'sw', at: { x: left, y: bottom } },
    { id: 'w', at: { x: left, y: midY } },
  ];
}

/** The handle under a point, if any. `radius` is the grab distance in stage pixels. */
export function handleAt(shape: Shape, point: Point, radius: number): HandleId | null {
  for (const handle of handlesOf(shape)) {
    if (Math.hypot(handle.at.x - point.x, handle.at.y - point.y) <= radius) return handle.id;
  }
  return null;
}

/** Distance from a point to a line segment. */
function distanceToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

/**
 * Whether a point is on the shape's line. Only the line counts, not the inside – the shapes are
 * outlines drawn over code, and a click inside a box should not grab the box.
 */
export function hitShape(shape: Shape, point: Point, tolerance: number = HIT_TOLERANCE): boolean {
  if (isSegment(shape)) {
    return distanceToSegment(point, { x: shape.x1, y: shape.y1 }, { x: shape.x2, y: shape.y2 }) <= tolerance;
  }

  const { left, top, right, bottom } = boundsOf(shape);
  if (shape.kind === 'box') {
    const insideOuter =
      point.x >= left - tolerance &&
      point.x <= right + tolerance &&
      point.y >= top - tolerance &&
      point.y <= bottom + tolerance;
    const insideInner =
      point.x > left + tolerance &&
      point.x < right - tolerance &&
      point.y > top + tolerance &&
      point.y < bottom - tolerance;
    return insideOuter && !insideInner;
  }

  // Circle (an ellipse in a non-square box): how far the point is from the outline, in pixels
  // measured along the smaller radius – exact for a circle and close enough for an ellipse.
  const radiusX = Math.max((right - left) / 2, 1);
  const radiusY = Math.max((bottom - top) / 2, 1);
  const ratio = Math.hypot((point.x - (left + right) / 2) / radiusX, (point.y - (top + bottom) / 2) / radiusY);
  return Math.abs(ratio - 1) * Math.min(radiusX, radiusY) <= tolerance;
}

/** The topmost shape (the last one drawn) hit by a point, or null. */
export function shapeAt(shapes: readonly Shape[], point: Point): Shape | null {
  for (let index = shapes.length - 1; index >= 0; index--) {
    if (hitShape(shapes[index], point)) return shapes[index];
  }
  return null;
}

/** A copy of the shape moved by a distance. */
export function moveShape(shape: Shape, dx: number, dy: number): Shape {
  return { ...shape, x1: shape.x1 + dx, y1: shape.y1 + dy, x2: shape.x2 + dx, y2: shape.y2 + dy };
}

/**
 * A copy of `original` with one handle dragged to a point. Computed from the shape as it was when the
 * drag began, so the result depends only on where the pointer is now – no drift, and dragging a handle
 * past the opposite side simply turns the shape over.
 */
export function dragHandle(original: Shape, handle: HandleId, point: Point): Shape {
  if (handle === 'start') return { ...original, x1: point.x, y1: point.y };
  if (handle === 'end') return { ...original, x2: point.x, y2: point.y };

  const { left, top, right, bottom } = boundsOf(original);
  const nextLeft = handle.includes('w') ? point.x : left;
  const nextRight = handle.includes('e') ? point.x : right;
  const nextTop = handle.includes('n') ? point.y : top;
  const nextBottom = handle.includes('s') ? point.y : bottom;
  return { ...original, x1: nextLeft, y1: nextTop, x2: nextRight, y2: nextBottom };
}

/** The two lines that make an arrow head, as points: the left wing, the tip and the right wing. */
export function arrowHead(shape: Shape, length = 30, spread = Math.PI / 7): [Point, Point, Point] {
  const angle = Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1);
  const tip = { x: shape.x2, y: shape.y2 };
  return [
    { x: tip.x - length * Math.cos(angle - spread), y: tip.y - length * Math.sin(angle - spread) },
    tip,
    { x: tip.x - length * Math.cos(angle + spread), y: tip.y - length * Math.sin(angle + spread) },
  ];
}
