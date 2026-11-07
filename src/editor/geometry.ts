import { monaco } from './monacoSetup';
import type { LineRange } from '../models/frame';
import type { Rect } from './camera';
import { textColumns } from './textMetrics';

/** Width used for an empty line, so a frame around it is still visible. */
const MIN_WIDTH = 24;

/** A line that is still being typed, with the text it will have when finished. */
export interface TypingLine {
  line: number;
  finalText: string;
}

/**
 * Pixel box around the text of `line`, relative to the editor's top-left
 * corner and the current scroll position. Leading indentation is excluded.
 *
 * The width is computed from the text, not measured in the DOM. The font is
 * monospace, so columns × character width is exact – and it also works for a
 * line Monaco has not rendered yet, which is exactly the moment a line has
 * just been finished and its callout appears. For the line still being typed,
 * its final text is used, so a frame around it already has its finished width.
 */
export function lineRect(editor: monaco.editor.ICodeEditor, line: number, typing?: TypingLine | null): Rect | null {
  const model = editor.getModel();
  if (!model || line < 1 || line > model.getLineCount()) return null;

  const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight);
  const charWidth = editor.getOption(monaco.editor.EditorOption.fontInfo).typicalHalfwidthCharacterWidth;
  const top = editor.getTopForLineNumber(line) - editor.getScrollTop();

  const text = typing?.line === line ? typing.finalText : model.getLineContent(line);
  const { start, end } = textColumns(text, model.getOptions().tabSize);
  const left = editor.getLayoutInfo().contentLeft + start * charWidth - editor.getScrollLeft();
  return { x: left, y: top, width: Math.max(0, end - start) * charWidth, height: lineHeight };
}

/** Bounding box around the text of every line in `range`. Empty lines only add height. */
export function rangeRect(
  editor: monaco.editor.ICodeEditor,
  range: LineRange,
  typing?: TypingLine | null,
): Rect | null {
  const rects: Rect[] = [];
  for (let line = range.startLine; line <= range.endLine; line++) {
    const rect = lineRect(editor, line, typing);
    if (rect) rects.push(rect);
  }
  if (rects.length === 0) return null;

  const withText = rects.filter((rect) => rect.width > 0);
  const horizontal = withText.length > 0 ? withText : rects;

  const left = Math.min(...horizontal.map((rect) => rect.x));
  const right = Math.max(...horizontal.map((rect) => rect.x + rect.width));
  const top = rects[0].y;
  const bottom = rects[rects.length - 1].y + rects[rects.length - 1].height;

  return { x: left, y: top, width: Math.max(MIN_WIDTH, right - left), height: bottom - top };
}
