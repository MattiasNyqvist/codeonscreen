import { useRef, useState } from 'react';
import { pickFrameColor } from '../frame/colors';
import type { FrameColor, FrameColorChoice } from '../models/frame';
import type { Point, Shape, ShapeKind } from '../drawing/geometry';

/** What {@link useDrawing} gives the app: the shapes to draw and one action per drawing key. */
export interface Drawing {
  /** Drawing is possible: Presentation Mode is paused. */
  enabled: boolean;
  shapes: readonly Shape[];
  /** The shape kind the next drag draws, or null when the mouse selects and moves. */
  tool: ShapeKind | null;
  selectedId: number | null;
  /** The shape whose text is being typed, or null. */
  editingId: number | null;
  /** C, S, A or L: choose a tool; the same key again goes back to selecting. */
  toggleTool(kind: ShapeKind): void;
  /** Start a shape of the current tool at a point. Returns its id. */
  begin(point: Point): number | null;
  /** Replace a shape (used while dragging). */
  replace(shape: Shape): void;
  /** Drop a shape (a click without a drag). */
  remove(id: number): void;
  /** Select a shape, or nothing. */
  select(id: number | null): void;
  /** D, Delete or Backspace: remove the selected shape. */
  deleteSelected(): void;
  /** Enter: type text in the selected shape. */
  startEditing(): void;
  /** Enter or Esc in the text field. */
  stopEditing(): void;
  /** The text of a shape, as it is typed. */
  setText(id: number, text: string): void;
  /** R, G, B or M with a shape selected: it gets that colour too. */
  recolorSelected(choice: FrameColorChoice): void;
  /** The tool goes back to selecting (after one shape is drawn). */
  finishTool(): void;
}

/**
 * The drawing layer's state: a handful of shapes on top of the paused stage. Nothing is saved and
 * nothing touches the code – when Presentation Mode stops being paused, everything is dropped.
 *
 * @param enabled - true while paused; the shapes exist only then
 * @param colorChoice - the highlight colour setting, used for every new shape
 */
export function useDrawing(enabled: boolean, colorChoice: FrameColorChoice): Drawing {
  const [shapes, setShapes] = useState<readonly Shape[]>([]);
  const [tool, setTool] = useState<ShapeKind | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [wasEnabled, setWasEnabled] = useState(enabled);
  const nextIdRef = useRef(1);
  const lastColorRef = useRef<FrameColor | null>(null);

  // Leaving the pause drops everything. Done while rendering rather than in an effect, so the shapes
  // are never drawn for one frame after the pause has ended.
  if (wasEnabled !== enabled) {
    setWasEnabled(enabled);
    if (!enabled) {
      setShapes([]);
      setTool(null);
      setSelectedId(null);
      setEditingId(null);
    }
  }

  const nextColor = (choice: FrameColorChoice): FrameColor => {
    const color = pickFrameColor(choice, lastColorRef.current);
    lastColorRef.current = color;
    return color;
  };

  return {
    enabled,
    shapes,
    tool,
    selectedId,
    editingId,
    toggleTool: (kind) => {
      if (!enabled || editingId !== null) return;
      setTool(tool === kind ? null : kind);
      setSelectedId(null);
    },
    begin: (point) => {
      if (!enabled || tool === null) return null;
      const id = nextIdRef.current++;
      const shape: Shape = {
        id,
        kind: tool,
        x1: point.x,
        y1: point.y,
        x2: point.x,
        y2: point.y,
        color: nextColor(colorChoice),
        text: '',
      };
      setShapes((current) => [...current, shape]);
      return id;
    },
    replace: (shape) => setShapes((current) => current.map((item) => (item.id === shape.id ? shape : item))),
    remove: (id) => {
      setShapes((current) => current.filter((item) => item.id !== id));
      setSelectedId((current) => (current === id ? null : current));
    },
    select: (id) => {
      setSelectedId(id);
      setEditingId(null);
    },
    deleteSelected: () => {
      if (!enabled || selectedId === null || editingId !== null) return;
      setShapes((current) => current.filter((item) => item.id !== selectedId));
      setSelectedId(null);
    },
    startEditing: () => {
      if (enabled && selectedId !== null) setEditingId(selectedId);
    },
    stopEditing: () => setEditingId(null),
    setText: (id, text) => setShapes((current) => current.map((item) => (item.id === id ? { ...item, text } : item))),
    recolorSelected: (choice) => {
      if (!enabled || selectedId === null) return;
      const color = nextColor(choice);
      setShapes((current) => current.map((item) => (item.id === selectedId ? { ...item, color } : item)));
    },
    finishTool: () => setTool(null),
  };
}
