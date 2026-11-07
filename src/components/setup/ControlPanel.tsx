import type { ReactNode } from 'react';
import type { KeySounds } from '../../audio/keySounds';
import type { HintId } from '../../models/controlHints';
import { getLanguage, type CommentSyntax } from '../../models/language';
import { MARKER_PREFIX, MARKERS, type Marker, type MarkerSwitches } from '../../models/script';
import type { Settings } from '../../models/settings';
import { previewLine } from '../../source/previewLine';
import { CommandIcon } from '../CommandIcon';
import { Checkbox } from '../Checkbox';
import { Switch } from '../Switch';
import {
  FormatSwitch,
  FrameColorPicker,
  PointerSelect,
  SoundControl,
  SpeedControl,
  SpotlightSizeControl,
} from './SettingControls';
import { TypingPreview } from './TypingPreview';

/** Props for {@link ControlPanel}. */
export interface ControlPanelProps {
  settings: Settings;
  /** The panel is open; closed, it is a thin strip and the code has the whole width. */
  isOpen: boolean;
  /** Opens or closes the panel. */
  onToggle(): void;
  /** Off for the experienced user: the notes are hidden (the page hides the tooltips). */
  showHelpText: boolean;
  /** The app's key sounds, for the typing preview. */
  sounds: KeySounds;
  /** Called with the settings that changed. */
  onChange(changes: Partial<Settings>): void;
  /** Sound changes go through here so the app can play a sample. */
  onSoundLevelChange(level: number): void;
}

/**
 * The settings, beside the code: the commands, how it is typed and how the screen looks. You set them about
 * once per session, and a newcomer can skip all of it – so the panel opens and closes from its own title,
 * and the Start button is not here but above the code, where it is always in reach.
 *
 * Everything that only explains – notes and tooltips – goes away when help text is switched off. What you
 * need to use the app stays: the command summaries.
 */
export function ControlPanel(props: ControlPanelProps) {
  const { settings, isOpen, onToggle, showHelpText, sounds, onChange, onSoundLevelChange } = props;
  const syntax = getLanguage(settings.languageId).comments;

  return (
    <aside className={`panel ${isOpen ? '' : 'panel--closed'}`} aria-label="Settings">
      <Control hint="panel">
        <button className="panel__title" onClick={onToggle} aria-expanded={isOpen} aria-controls="settings-body">
          <Chevron />
          <span className="panel__title-text">Settings</span>
        </button>
      </Control>

      {isOpen && (
        <div id="settings-body" className="panel__scroll">
          <Group title="Commands">
            <ScriptMarkers
              isOn={settings.scriptMarkers}
              markers={settings.markers}
              syntax={syntax}
              showHelpText={showHelpText}
              onToggle={(scriptMarkers) => onChange({ scriptMarkers })}
              onChange={(markers) => onChange({ markers })}
            />
          </Group>

          <Group title="Typing">
            <Control hint="speed">
              <SpeedControl value={settings.speed} onChange={(speed) => onChange({ speed })} />
            </Control>
            <Control hint="preview">
              <TypingPreview
                text={previewLine(settings.source, syntax)}
                speed={settings.speed}
                typos={settings.typos}
                sounds={sounds}
              />
            </Control>
            <Control hint="sound">
              <SoundControl value={settings.soundLevel} onChange={onSoundLevelChange} />
            </Control>
            <Control hint="typos">
              <Switch
                label="Make typos and fix them"
                checked={settings.typos}
                onChange={(typos) => onChange({ typos })}
              />
            </Control>
          </Group>

          {/* Everything about how the screen looks – set before you start. R, G, B, M and P can still change it live. */}
          <Group title="Look">
            <Control hint="format">
              <FormatSwitch value={settings.format} onChange={(format) => onChange({ format })} />
            </Control>
            <div className="channel__group">
              <Control hint="highlight">
                <FrameColorPicker value={settings.frameColor} onChange={(frameColor) => onChange({ frameColor })} />
              </Control>
              <Control hint="pointer">
                <PointerSelect value={settings.pointerMode} onChange={(pointerMode) => onChange({ pointerMode })} />
              </Control>
              <Control hint="spotlight">
                <SpotlightSizeControl
                  value={settings.spotlightRadius}
                  disabled={settings.pointerMode !== 'spotlight'}
                  onChange={(spotlightRadius) => onChange({ spotlightRadius })}
                />
              </Control>
              <Control hint="lineNumbers">
                <Switch
                  label="Show line numbers in presentation"
                  checked={settings.lineNumbers}
                  onChange={(lineNumbers) => onChange({ lineNumbers })}
                />
              </Control>
            </div>
          </Group>
        </div>
      )}
    </aside>
  );
}

const MARKER_HINTS: Record<Marker, HintId> = {
  callout: 'markerCallout',
  subtitle: 'markerSubtitle',
  highlight: 'markerHighlight',
  pause: 'markerPause',
  step: 'markerStep',
};

/** What each command does, in a few words beside its tick box – always shown. The tooltip has the full sentence. */
const MARKER_SUMMARIES: Record<Marker, string> = {
  callout: 'Note next to a line',
  subtitle: 'Subtitle at the bottom',
  pause: 'Pause typing',
  highlight: 'Highlight the line, then pause',
  step: 'Title card',
};

/** `// @@pause`, `# @@pause` or `<!-- @@pause -->` – a command the way the chosen language writes comments. */
export function exampleMarker(syntax: CommentSyntax): string {
  const marker = `${MARKER_PREFIX}pause`;
  if (syntax.line) return `${syntax.line} ${marker}`;
  if (syntax.block) return `${syntax.block[0]} ${marker} ${syntax.block[1]}`;
  return marker;
}

/** Props for {@link ScriptMarkers}. */
interface ScriptMarkersProps {
  isOn: boolean;
  markers: MarkerSwitches;
  /** The chosen language's comments, for the example in the note. */
  syntax: CommentSyntax;
  showHelpText: boolean;
  /** The main tick box. */
  onToggle(isOn: boolean): void;
  /** One marker switched on or off. */
  onChange(markers: MarkerSwitches): void;
}

/**
 * Presentation commands (script markers in the code): the main tick box, and
 * under it one row per command – its switch, its name and what it does in a few
 * words. Each command is named once; there is no separate list repeating the
 * names. With help text on, one example in the chosen language follows.
 *
 * While the main tick box is off the command tick boxes are disabled and show as off,
 * because that is what they are. Each one keeps its own setting and gets it
 * back when the main one is ticked again.
 */
function ScriptMarkers({ isOn, markers, syntax, showHelpText, onToggle, onChange }: ScriptMarkersProps) {
  return (
    <div className="script">
      <Control hint="scriptMarkers">
        <Checkbox label="Use commands in comments" checked={isOn} onChange={onToggle} />
      </Control>

      <div className={`script__markers ${isOn ? '' : 'script__markers--off'}`} role="group" aria-label="Commands">
        {MARKERS.map((marker) => (
          <Control key={marker} hint={MARKER_HINTS[marker]}>
            <Checkbox
              label={
                <span className="script__row">
                  {/* The same icon the code box shows after a command line, so the two are easy to connect. */}
                  <CommandIcon icon={marker} />
                  <code className="script__marker">{`${MARKER_PREFIX}${marker}`}</code>
                  <span className="script__summary">{MARKER_SUMMARIES[marker]}</span>
                </span>
              }
              checked={isOn && markers[marker]}
              disabled={!isOn}
              onChange={(on) => onChange({ ...markers, [marker]: on })}
            />
          </Control>
        ))}
      </div>

      {showHelpText && (
        <p className="channel__note script__note">
          A comment with <code>@@</code>, like <code>{exampleMarker(syntax)}</code>, acts on the line below it and is
          never shown itself. Other comments are typed as code.
        </p>
      )}
    </div>
  );
}

/** Props for {@link Group}. */
interface GroupProps {
  title: string;
  children: ReactNode;
}

/** One framed group of controls inside a step, titled in its frame. */
function Group({ title, children }: GroupProps) {
  return (
    <fieldset className="channel">
      <legend className="channel__title">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Marks a control for its tooltip. `useHoverHint` reads the `data-hint` attribute. */
export function Control({ hint, children }: { hint: HintId; children: ReactNode }) {
  return (
    <div className="control" data-hint={hint}>
      {children}
    </div>
  );
}

/** Points right when closed and turns down when open (rotated in CSS). */
function Chevron() {
  return (
    <svg className="panel__chevron" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
