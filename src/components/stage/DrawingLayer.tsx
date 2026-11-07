import { useRef, type PointerEvent } from 'react';
import {
  arrowHead,
  boundsOf,
  dragHandle,
  handleAt,
  handlesOf,
  isSegment,
  isTooSmall,
  moveShape,
  shapeAt,
  textAnchor,
  type HandleId,
  type Point,
  type Shape,
} from '../../drawing/geometry';
import type { Drawing } from '../../hooks/useDrawing';

/** How close, in stage pixels, the pointer has to be to a handle to grab it. */
const HANDLE_GRAB_RADIUS = 16;

/** What the mouse is doing right now. Kept in a ref: it changes on every move and nothing renders from it. */
type Gesture =
  | { kind: 'create'; id: number }
  | { kind: 'move'; original: Shape; from: Point }
  | { kind: 'resize'; original: Shape; handle: HandleId };

/** Props for {@link DrawingLayer}. */
export interface DrawingLayerProps {
  drawing: Drawing;
  /** The stage size in stage pixels; the layer draws in these units whatever the screen scale is. */
  width: number;
  height: number;
}

/**
 * The paused stage's drawing layer: circles, boxes, arrows and lines over the code, like a light Excalidraw.
 * It exists only while paused (the shapes are dropped when typing carries on) and never touches the
 * code. All shapes are in stage pixels, so they stay put whatever the window size.
 */
export function DrawingLayer({ drawing, width, height }: DrawingLayerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const { shapes, selectedId, editingId, tool } = drawing;

  if (!drawing.enabled) return null;

  /** The pointer position in stage pixels – the stage may be scaled down to fit the window. */
  const toStage = (event: PointerEvent): Point => {
    const bounds = svgRef.current!.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) * width) / bounds.width,
      y: ((event.clientY - bounds.top) * height) / bounds.height,
    };
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (editingId !== null) {
      drawing.stopEditing();
      return;
    }
    const point = toStage(event);
    svgRef.current!.setPointerCapture(event.pointerId);

    if (tool !== null) {
      const id = drawing.begin(point);
      if (id !== null) gestureRef.current = { kind: 'create', id };
      return;
    }

    const selected = shapes.find((shape) => shape.id === selectedId);
    const handle = selected ? handleAt(selected, point, HANDLE_GRAB_RADIUS) : null;
    if (selected && handle) {
      gestureRef.current = { kind: 'resize', original: selected, handle };
      return;
    }

    const hit = shapeAt(shapes, point);
    drawing.select(hit?.id ?? null);
    if (hit) gestureRef.current = { kind: 'move', original: hit, from: point };
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    const point = toStage(event);

    if (gesture.kind === 'create') {
      const shape = shapes.find((item) => item.id === gesture.id);
      if (shape) drawing.replace({ ...shape, x2: point.x, y2: point.y });
    } else if (gesture.kind === 'resize') {
      drawing.replace(dragHandle(gesture.original, gesture.handle, point));
    } else {
      drawing.replace(moveShape(gesture.original, point.x - gesture.from.x, point.y - gesture.from.y));
    }
  };

  const onPointerUp = () => {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    if (gesture?.kind !== 'create') return;

    // A click without a drag is not a drawing. A real one is selected, and the tool goes back to selecting.
    const shape = shapes.find((item) => item.id === gesture.id);
    if (shape && isTooSmall(shape)) {
      drawing.remove(gesture.id);
    } else {
      drawing.select(gesture.id);
    }
    drawing.finishTool();
  };

  const selected = shapes.find((shape) => shape.id === selectedId);
  const editing = shapes.find((shape) => shape.id === editingId);
  const editAt = editing ? textAnchor(editing) : null;

  return (
    <div className={`drawing ${tool ? 'drawing--drawing' : ''}`} data-drawing-layer>
      <svg
        ref={svgRef}
        className="drawing__svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {shapes.map((shape) => (
          <ShapeView key={shape.id} shape={shape} hideText={shape.id === editingId} />
        ))}
        {selected && !editing && <Handles shape={selected} />}
      </svg>
      {editing && editAt && (
        <input
          key={editing.id}
          className={`drawing__text drawing__text--${editing.color}`}
          style={{ left: editAt.x, top: editAt.y }}
          value={editing.text}
          autoFocus
          spellCheck={false}
          aria-label="Text in the shape"
          onChange={(event) => drawing.setText(editing.id, event.target.value)}
          // Enter ends the text. Esc ends it too, but stays here: leaving Presentation Mode in the middle
          // of typing a label would be a nasty surprise.
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              drawing.stopEditing();
            }
          }}
          onBlur={() => drawing.stopEditing()}
        />
      )}
    </div>
  );
}

function ShapeView({ shape, hideText }: { shape: Shape; hideText: boolean }) {
  const { left, top, right, bottom } = boundsOf(shape);
  const anchor = textAnchor(shape);
  const [wingA, tip, wingB] = arrowHead(shape);

  return (
    <g className={`drawing__shape drawing__shape--${shape.color}`}>
      {shape.kind === 'box' && (
        <rect x={left} y={top} width={right - left} height={bottom - top} rx={6} className="drawing__line" />
      )}
      {shape.kind === 'circle' && (
        <ellipse
          cx={(left + right) / 2}
          cy={(top + bottom) / 2}
          rx={(right - left) / 2}
          ry={(bottom - top) / 2}
          className="drawing__line"
        />
      )}
      {isSegment(shape) && (
        <>
          <line x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} className="drawing__line" />
          {shape.kind === 'arrow' && (
            <polyline
              points={`${wingA.x},${wingA.y} ${tip.x},${tip.y} ${wingB.x},${wingB.y}`}
              className="drawing__line"
            />
          )}
        </>
      )}
      {shape.text && !hideText && (
        <text x={anchor.x} y={anchor.y} className="drawing__label">
          {shape.text}
        </text>
      )}
    </g>
  );
}

function Handles({ shape }: { shape: Shape }) {
  const { left, top, right, bottom } = boundsOf(shape);
  return (
    <g className="drawing__handles">
      {!isSegment(shape) && (
        <rect x={left} y={top} width={right - left} height={bottom - top} className="drawing__selection" />
      )}
      {handlesOf(shape).map((handle) => (
        <circle key={handle.id} cx={handle.at.x} cy={handle.at.y} r={9} className="drawing__handle" />
      ))}
    </g>
  );
}
