import { useRef, type Ref } from 'react';
import type { TypingLine } from '../../editor/geometry';
import { useFitScale } from '../../hooks/useFitScale';
import type { Frame, LineRange } from '../../models/frame';
import type { LineHint } from '../../models/hint';
import { getLanguage, type LanguageId } from '../../models/language';
import type { PlaybackState } from '../../models/playback';
import type { PointerMode, Theme } from '../../models/settings';
import { STAGE_LAYOUTS, type StageFormat } from '../../models/stageFormat';
import { CodeStage, type CodeStageHandle } from './CodeStage';
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
  /** The current step title from the script, or null. */
  step: string | null;
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
  const { stageRef, languageId, pointerMode, spotlightRadius, state, format, showStartHint, ...stage } = props;
  const layout = STAGE_LAYOUTS[format];
  const scale = useFitScale(layout.width, layout.height);
  const frameRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`stage-view ${pointerMode === 'off' ? '' : 'stage-view--pointer'}`}>
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
        <PointerOverlay mode={pointerMode} spotlightRadius={spotlightRadius} stageRef={frameRef} />
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
            <span className="start-hint__sub start-hint__note">Switch off Help text to hide these tips</span>
          </div>
        )}
      </div>
    </div>
  );
}
