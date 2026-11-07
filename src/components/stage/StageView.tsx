import { useRef, type Ref } from 'react';
import type { TypingLine } from '../../editor/geometry';
import { useFitScale } from '../../hooks/useFitScale';
import type { Frame, LineRange } from '../../models/frame';
import { isFading } from '../../hints/lifetime';
import type { LineHint, StepCard, Subtitle } from '../../models/hint';
import { getLanguage, type LanguageId } from '../../models/language';
import type { PlaybackState } from '../../models/playback';
import type { PointerMode, Theme } from '../../models/settings';
import { STAGE_LAYOUTS, type StageFormat } from '../../models/stageFormat';
import type { Drawing } from '../../hooks/useDrawing';
import { CodeStage, type CodeStageHandle } from './CodeStage';
import { DrawingLayer } from './DrawingLayer';
import { PointerOverlay } from './PointerOverlay';

/** Props for {@link StageView}. */
export interface StageViewProps {
  stageRef: Ref<CodeStageHandle>;
  languageId: LanguageId;
  theme: Theme;
  pointerMode: PointerMode;
  spotlightRadius: number;
  state: PlaybackState;
  frame: Frame | null;
  hints: readonly LineHint[];
  zoomRange: LineRange | null;
  typingLine: TypingLine | null;
  /** The subtitle on screen, or null. */
  subtitle: Subtitle | null;
  /** The step title card on screen, or null. */
  stepCard: StepCard | null;
  /** The mouse wheel: up zooms in, down zooms out – the same as Z. */
  onZoom: (direction: 'in' | 'out') => void;
  /** Circles, boxes and arrows drawn over the paused stage. */
  drawing: Drawing;
  format: StageFormat;
  lineNumbers: boolean;
  /** Show "Press Space to start" briefly on entry (it fades by itself). Off when help text is off. */
  showStartHint: boolean;
}

/**
 * Presentation Mode – the view that gets recorded: only the stage, at the fixed size of its format
 * (1920×1080 or 1080×1920), centred on a plain backdrop and scaled down if the
 * window is smaller. No buttons – the keyboard drives everything and the mouse
 * only moves the pointer.
 */
export function StageView(props: StageViewProps) {
  const {
    stageRef,
    languageId,
    pointerMode,
    spotlightRadius,
    state,
    format,
    showStartHint,
    subtitle,
    stepCard,
    drawing,
    onZoom,
    ...stage
  } = props;
  const layout = STAGE_LAYOUTS[format];
  // The spotlight darkens everything but a circle, which makes drawing impossible. It steps aside while a
  // drawing tool is chosen or anything is drawn, and comes back when typing carries on. The setting stays.
  const isDrawing = drawing.tool !== null || drawing.shapes.length > 0;
  const overlayMode = isDrawing && pointerMode === 'spotlight' ? 'off' : pointerMode;
  const scale = useFitScale(layout.width, layout.height);
  const frameRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`stage-view ${pointerMode === 'off' ? '' : 'stage-view--pointer'}`}
      onWheel={(event) => {
        if (event.deltaY !== 0) onZoom(event.deltaY < 0 ? 'in' : 'out');
      }}
    >
      <div
        ref={frameRef}
        className="stage-view__frame"
        style={{ width: layout.width, height: layout.height, transform: `scale(${scale})` }}
      >
        <CodeStage
          ref={stageRef}
          language={languageId}
          fileName={getLanguage(languageId).fileName}
          dimOthers={state !== 'playing'}
          layout={layout}
          {...stage}
        />
        {subtitle && !stepCard && (
          // Like on TV: one or two lines at the bottom, white on a dark strip. Keyed, so a new one fades in.
          // Not shown behind a step card; its clock waits too (see usePresenter).
          <div
            key={subtitle.id}
            className={`subtitle subtitle--${format} ${isFading(subtitle) ? 'subtitle--fading' : ''}`}
            aria-live="polite"
          >
            <span>{subtitle.text}</span>
          </div>
        )}
        {stepCard && (
          // A title card in the middle of the screen while typing waits. It fades in and out by itself (CSS).
          <div key={stepCard.id} className="step-card" role="status">
            <div className="step-card__panel">{stepCard.title}</div>
          </div>
        )}
        <DrawingLayer drawing={drawing} width={layout.width} height={layout.height} />
        <PointerOverlay mode={overlayMode} spotlightRadius={spotlightRadius} stageRef={frameRef} />
        {showStartHint && state === 'idle' && (
          // Shown on every entry and gone in about three seconds (CSS), so it is out of the way
          // before you hit record in OBS. Hidden altogether when help text is off – and it says so.
          <div className="start-hint" aria-live="polite">
            <span>
              Press <kbd>Space</kbd> to start
            </span>
            <span className="start-hint__sub">
              Press <kbd>Esc</kbd> to leave Presentation Mode
            </span>
            <span className="start-hint__sub">
              When paused: <kbd>H</kbd> highlight · <kbd>Z</kbd> zoom (or the mouse wheel)
            </span>
            <span className="start-hint__sub">
              Draw: <kbd>C</kbd> circle · <kbd>S</kbd> square · <kbd>A</kbd> arrow · <kbd>L</kbd> line · <kbd>D</kbd>{' '}
              delete · <kbd>Enter</kbd> text
            </span>
            <span className="start-hint__sub start-hint__note">Switch off Help text to hide these tips</span>
          </div>
        )}
      </div>
    </div>
  );
}
