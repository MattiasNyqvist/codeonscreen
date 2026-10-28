import Editor, { type OnMount } from '@monaco-editor/react';
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from 'react';
import {
  IDENTITY,
  easeOutCubic,
  focusCamera,
  interpolate,
  project,
  projectX,
  toCssTransform,
  type CameraTransform,
} from '../../editor/camera';
import { dimDecorations } from '../../editor/decorations';
import { MONACO_THEMES, stageEditorOptions } from '../../editor/editorOptions';
import { lineRect, rangeRect, type TypingLine } from '../../editor/geometry';
import { monaco } from '../../editor/monacoSetup';
import { bubbleLeft, stackBubbles } from '../../editor/stackBubbles';
import { isFading } from '../../hints/lifetime';
import type { TypingTarget } from '../../hooks/useTypewriter';
import type { Frame, LineRange } from '../../models/frame';
import type { LineHint } from '../../models/hint';
import type { LanguageId } from '../../models/language';
import type { Theme } from '../../models/settings';
import type { StageLayout } from '../../models/stageFormat';
import { FrameOutline } from './FrameOutline';

/** Space between the end of a line and its bubble, in characters. */
const BUBBLE_GAP_CHARS = 5;
const ZOOM_DURATION_MS = 450;
/** Space between the code and the frame. */
const FRAME_PADDING = { x: 12, y: 4 };

/** Everything the rest of the app may do with the stage editor. Monaco stays in here. */
export interface CodeStageHandle extends TypingTarget {
  /** Text is only ever appended, so the last line is the one being typed. */
  getLastLine(): number;
  /** True for an empty or whitespace-only line (and for lines that do not exist). */
  isLineBlank(line: number): boolean;
}

/** Props for {@link CodeStage}. */
export interface CodeStageProps {
  ref?: Ref<CodeStageHandle>;
  language: LanguageId;
  fileName: string;
  theme: Theme;
  frame: Frame | null;
  /** Fade every line outside the frame. */
  dimOthers: boolean;
  hints: readonly LineHint[];
  /** Lines the camera zooms in on, or null for the full view. */
  zoomRange: LineRange | null;
  /** The line being typed inside the frame, so the frame can show its final size already. */
  typingLine: TypingLine | null;
  /** Size, font and bubble placement for the chosen format. */
  layout: StageLayout;
  lineNumbers: boolean;
  /** The current `@@step` title, shown next to the file name like a breadcrumb, or null. */
  step: string | null;
}

/**
 * The recorded editor: Monaco plus everything drawn on top of it – the frame,
 * the hint bubbles and the zoom camera.
 *
 * Positions are written straight to the DOM instead of through React state,
 * because they change on every scroll and every animation frame.
 */
export function CodeStage(props: CodeStageProps) {
  const { ref, language, fileName, theme, frame, dimOthers, hints, zoomRange, typingLine, layout, lineNumbers, step } =
    props;
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<monaco.editor.IEditorDecorationsCollection | null>(null);
  const cameraElementRef = useRef<HTMLDivElement>(null);
  const frameElementRef = useRef<HTMLDivElement>(null);
  const bubbleElementsRef = useRef(new Map<number, HTMLDivElement>());
  const cameraRef = useRef<CameraTransform>(IDENTITY);
  const animationRef = useRef<number | null>(null);
  const propsRef = useRef({ frame, hints, zoomRange, typingLine, layout });
  // A new object every render would make Monaco re-apply all options on every keystroke.
  const editorOptions = useMemo(() => stageEditorOptions(layout, lineNumbers), [layout, lineNumbers]);
  const [isMounted, setIsMounted] = useState(false);

  /**
   * Applies the camera transform, then places the frame (in editor coordinates,
   * inside the camera so it zooms with the code) and the bubbles (in screen
   * coordinates, outside the camera so their text keeps its size).
   */
  const layoutOverlays = useCallback(() => {
    const editor = editorRef.current;
    const cameraElement = cameraElementRef.current;
    if (!editor || !cameraElement) return;

    const camera = cameraRef.current;
    const { frame: currentFrame, hints: bubbles, typingLine: typing } = propsRef.current;
    cameraElement.style.transform = toCssTransform(camera);

    const frameElement = frameElementRef.current;
    const rect = currentFrame && rangeRect(editor, currentFrame, typing);
    if (frameElement && rect) {
      Object.assign(frameElement.style, {
        left: `${rect.x - FRAME_PADDING.x}px`,
        top: `${rect.y - FRAME_PADDING.y}px`,
        width: `${rect.width + FRAME_PADDING.x * 2}px`,
        height: `${rect.height + FRAME_PADDING.y * 2}px`,
      });
    }

    // Bubbles: five characters after the end of their line, horizontally;
    // stacked without overlap, vertically. Both in screen coordinates.
    const charWidth = editor.getOption(monaco.editor.EditorOption.fontInfo).typicalHalfwidthCharacterWidth;
    const gap = BUBBLE_GAP_CHARS * charWidth * camera.scale;
    const containerWidth = editor.getLayoutInfo().width;

    const placed = bubbles.flatMap((hint) => {
      const element = bubbleElementsRef.current.get(hint.line);
      const lineBox = lineRect(editor, hint.line);
      if (!element || !lineBox) return [];
      const lineEndX = projectX(lineBox.x + lineBox.width, camera);
      element.style.left = `${bubbleLeft(lineEndX, gap, element.offsetWidth, containerWidth)}px`;
      return [{ element, anchorY: project(lineBox.y + lineBox.height / 2, camera), height: element.offsetHeight }];
    });
    stackBubbles(placed).forEach(({ top, arrowY }, index) => {
      placed[index].element.style.top = `${top}px`;
      placed[index].element.style.setProperty('--arrow-y', `${arrowY}px`);
    });
  }, []);

  /** Where the camera should end up for the current zoom range. */
  const targetCamera = useCallback((): CameraTransform => {
    const editor = editorRef.current;
    const { zoomRange: range, typingLine: typing } = propsRef.current;
    if (!editor || !range) return IDENTITY;

    const focus = rangeRect(editor, range, typing);
    if (!focus) return IDENTITY;

    const { width, height } = editor.getLayoutInfo();
    return focusCamera(focus, { width, height });
  }, []);

  /**
   * Moves the camera with requestAnimationFrame rather than a CSS transition,
   * so the bubbles outside the camera can follow it in the same frame.
   */
  const animateCamera = useCallback(() => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);

    const from = cameraRef.current;
    const to = targetCamera();
    const startedAt = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / ZOOM_DURATION_MS);
      cameraRef.current = interpolate(from, to, easeOutCubic(progress));
      layoutOverlays();
      animationRef.current = progress < 1 ? requestAnimationFrame(step) : null;
    };
    animationRef.current = requestAnimationFrame(step);
  }, [layoutOverlays, targetCamera]);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    decorationsRef.current = editor.createDecorationsCollection();
    editor.onDidScrollChange(layoutOverlays);
    editor.onDidLayoutChange(layoutOverlays);
    setIsMounted(true);
  };

  useEffect(
    () => () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    },
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      clear() {
        editorRef.current?.setValue('');
      },

      append(text) {
        const editor = editorRef.current;
        const model = editor?.getModel();
        if (!editor || !model) return;

        const end = model.getFullModelRange().getEndPosition();
        model.applyEdits([{ range: monaco.Range.fromPositions(end), text }]);
        moveCursorToEnd(editor);
      },

      backspace() {
        const editor = editorRef.current;
        const model = editor?.getModel();
        if (!editor || !model) return;

        const end = model.getFullModelRange().getEndPosition();
        if (end.column === 1) return; // never removes a line break
        model.applyEdits([
          { range: new monaco.Range(end.lineNumber, end.column - 1, end.lineNumber, end.column), text: '' },
        ]);
        moveCursorToEnd(editor);
      },

      focus() {
        editorRef.current?.focus();
      },

      getLastLine() {
        return editorRef.current?.getModel()?.getLineCount() ?? 1;
      },

      isLineBlank(line) {
        const model = editorRef.current?.getModel();
        if (!model || line < 1 || line > model.getLineCount()) return true;
        return model.getLineContent(line).trim() === '';
      },
    }),
    [],
  );

  useEffect(() => {
    const lineCount = editorRef.current?.getModel()?.getLineCount() ?? 0;
    decorationsRef.current?.set(frame && dimOthers ? dimDecorations(frame, lineCount) : []);
  }, [frame, dimOthers, isMounted]);

  // Layout effects position a new frame or bubble before the browser paints it.
  useLayoutEffect(() => {
    propsRef.current = { frame, hints, zoomRange, typingLine, layout };
    layoutOverlays();
  }, [frame, hints, zoomRange, typingLine, layout, isMounted, layoutOverlays]);

  useLayoutEffect(() => {
    if (isMounted) animateCamera();
  }, [zoomRange, isMounted, animateCamera]);

  return (
    <div className={`stage stage--${layout.bubbles}`}>
      <div className="stage__tabbar">
        <span className="stage__tab">{fileName}</span>
        {/* Like VS Code's breadcrumbs: where you are, without covering the code. Keyed, so a new title fades in. */}
        {step && (
          <span key={step} className="stage__step">
            <span className="stage__step-arrow" aria-hidden="true">
              ›
            </span>
            {step}
          </span>
        )}
      </div>
      <div className="stage__editor" data-keyboard-surface>
        <div ref={cameraElementRef} className="stage__camera">
          <Editor
            theme={MONACO_THEMES[theme]}
            language={language}
            defaultValue=""
            options={editorOptions}
            onMount={handleMount}
          />
          {frame && <FrameOutline key={frame.id} ref={frameElementRef} color={frame.color} />}
        </div>
        {layout.bubbles === 'beside-line' &&
          hints.map((hint) => (
            <div
              key={hint.line}
              ref={bindToMap(bubbleElementsRef, hint.line)}
              className={`hint-bubble ${isFading(hint) ? 'hint-bubble--fading' : ''}`}
            >
              {hint.text}
            </div>
          ))}
      </div>
      {layout.bubbles === 'captions' && (
        // Portrait: bubbles become captions in their own strip below the code. The
        // highlight box already shows which line they belong to, so no arrow is needed.
        <div className="stage__captions">
          {hints.map((hint) => (
            <div key={hint.line} className={`hint-caption ${isFading(hint) ? 'hint-bubble--fading' : ''}`}>
              {hint.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function moveCursorToEnd(editor: monaco.editor.IStandaloneCodeEditor): void {
  const end = editor.getModel()!.getFullModelRange().getEndPosition();
  editor.setPosition(end);
  // Only scroll when the cursor leaves the view – scrolling on every key makes the picture flicker.
  editor.revealPositionInCenterIfOutsideViewport(end);
}

/** Callback ref that keeps a key → element map up to date. Reads the map only when React calls it. */
function bindToMap<K>(mapRef: { current: Map<K, HTMLDivElement> }, key: K) {
  return (element: HTMLDivElement | null) => {
    if (element) mapRef.current.set(key, element);
    else mapRef.current.delete(key);
  };
}
