import { linesOutside } from '../frame/lines';
import type { LineRange } from '../models/frame';
import { monaco } from './monacoSetup';

/**
 * Fades every line outside the frame, which pulls the viewer's eye to it.
 *
 * The frame itself is an HTML overlay (see `FrameOverlay`), because Monaco
 * decorations cannot be animated. The dimming is a decoration because it
 * needs to follow the text exactly. The CSS class lives in `app.css` and must
 * be global, since Monaco renders it outside React.
 */
export function dimDecorations(frame: LineRange, lineCount: number): monaco.editor.IModelDeltaDecoration[] {
  return linesOutside(frame, lineCount).map((range) => ({
    range: new monaco.Range(range.startLine, 1, range.endLine, Number.MAX_SAFE_INTEGER),
    options: { inlineClassName: 'line-dimmed' },
  }));
}
