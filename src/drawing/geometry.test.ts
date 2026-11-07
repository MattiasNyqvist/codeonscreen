import { describe, expect, it } from 'vitest';
import {
  boundsOf,
  dragHandle,
  handleAt,
  handlesOf,
  hitShape,
  isTooSmall,
  moveShape,
  shapeAt,
  textAnchor,
  type Shape,
} from './geometry';

const shape = (overrides: Partial<Shape>): Shape => ({
  id: 1,
  kind: 'box',
  x1: 100,
  y1: 100,
  x2: 300,
  y2: 200,
  color: 'red',
  text: '',
  ...overrides,
});

describe('boundsOf', () => {
  it('orders the corners, whichever way the shape was dragged', () => {
    expect(boundsOf(shape({ x1: 300, y1: 200, x2: 100, y2: 100 }))).toEqual({
      left: 100,
      top: 100,
      right: 300,
      bottom: 200,
    });
  });
});

describe('isTooSmall', () => {
  it('drops a stray click but keeps a real shape', () => {
    expect(isTooSmall(shape({ x2: 103, y2: 104 }))).toBe(true);
    expect(isTooSmall(shape({}))).toBe(false);
  });

  it('measures an arrow by its length, so a long thin one is kept', () => {
    expect(isTooSmall(shape({ kind: 'arrow', x1: 0, y1: 0, x2: 200, y2: 0 }))).toBe(false);
    expect(isTooSmall(shape({ kind: 'arrow', x1: 0, y1: 0, x2: 3, y2: 3 }))).toBe(true);
  });
});

describe('hitShape', () => {
  it('hits the line of a box but not its inside', () => {
    const box = shape({});
    expect(hitShape(box, { x: 100, y: 150 })).toBe(true);
    expect(hitShape(box, { x: 200, y: 150 })).toBe(false);
    expect(hitShape(box, { x: 500, y: 150 })).toBe(false);
  });

  it('hits the outline of a circle but not its centre', () => {
    const circle = shape({ kind: 'circle', x1: 0, y1: 0, x2: 200, y2: 200 });
    expect(hitShape(circle, { x: 200, y: 100 })).toBe(true);
    expect(hitShape(circle, { x: 100, y: 100 })).toBe(false);
  });

  it('treats a line like an arrow: kept by length, two handles, hit along it', () => {
    const line = shape({ kind: 'line', x1: 0, y1: 0, x2: 200, y2: 0 });
    expect(isTooSmall(line)).toBe(false);
    expect(isTooSmall(shape({ kind: 'line', x1: 0, y1: 0, x2: 3, y2: 3 }))).toBe(true);
    expect(handlesOf(line)).toHaveLength(2);
    expect(hitShape(line, { x: 100, y: 5 })).toBe(true);
    expect(hitShape(line, { x: 100, y: 60 })).toBe(false);
  });

  it('hits along an arrow', () => {
    const arrow = shape({ kind: 'arrow', x1: 0, y1: 0, x2: 200, y2: 0 });
    expect(hitShape(arrow, { x: 100, y: 5 })).toBe(true);
    expect(hitShape(arrow, { x: 100, y: 60 })).toBe(false);
    expect(hitShape(arrow, { x: 400, y: 0 })).toBe(false);
  });
});

describe('shapeAt', () => {
  it('returns the topmost shape when two lines cross', () => {
    const below = shape({ id: 1 });
    const above = shape({ id: 2 });
    expect(shapeAt([below, above], { x: 100, y: 150 })?.id).toBe(2);
  });

  it('returns null on empty space', () => {
    expect(shapeAt([shape({})], { x: 900, y: 900 })).toBeNull();
  });
});

describe('handles', () => {
  it('has eight on a box and two on an arrow', () => {
    expect(handlesOf(shape({}))).toHaveLength(8);
    expect(handlesOf(shape({ kind: 'arrow' }))).toHaveLength(2);
  });

  it('finds the handle under the pointer', () => {
    expect(handleAt(shape({}), { x: 302, y: 198 }, 12)).toBe('se');
    expect(handleAt(shape({}), { x: 200, y: 150 }, 12)).toBeNull();
  });
});

describe('dragHandle', () => {
  it('changes only the width when a side handle is dragged', () => {
    const result = dragHandle(shape({}), 'e', { x: 400, y: 999 });
    expect(boundsOf(result)).toEqual({ left: 100, top: 100, right: 400, bottom: 200 });
  });

  it('changes both sides when a corner is dragged', () => {
    const result = dragHandle(shape({}), 'nw', { x: 50, y: 20 });
    expect(boundsOf(result)).toEqual({ left: 50, top: 20, right: 300, bottom: 200 });
  });

  it('turns the shape over when a handle is dragged past the opposite side', () => {
    const result = dragHandle(shape({}), 'e', { x: 40, y: 150 });
    expect(boundsOf(result)).toEqual({ left: 40, top: 100, right: 100, bottom: 200 });
  });

  it('moves one end of an arrow and leaves the other', () => {
    const arrow = shape({ kind: 'arrow', x1: 0, y1: 0, x2: 100, y2: 0 });
    expect(dragHandle(arrow, 'end', { x: 50, y: 80 })).toMatchObject({ x1: 0, y1: 0, x2: 50, y2: 80 });
  });
});

describe('moveShape', () => {
  it('moves both points', () => {
    expect(moveShape(shape({}), 10, -5)).toMatchObject({ x1: 110, y1: 95, x2: 310, y2: 195 });
  });
});

describe('textAnchor', () => {
  it('is the centre of a box and above the middle of an arrow', () => {
    expect(textAnchor(shape({}))).toEqual({ x: 200, y: 150 });
    const arrow = textAnchor(shape({ kind: 'arrow', x1: 0, y1: 100, x2: 200, y2: 100 }));
    expect(arrow.x).toBe(100);
    expect(arrow.y).toBeLessThan(100);
  });
});
