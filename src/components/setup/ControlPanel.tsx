import type { ReactNode } from 'react';
import type { KeySounds } from '../../audio/keySounds';
import type { HintId } from '../../models/controlHints';
import { getLanguage, type CommentSyntax } from '../../models/language';
import { MARKER_PREFIX, MARKERS, type Marker, type MarkerSwitches } from '../../models/script';
import type { Settings } from '../../models/settings';
import { previewLine } from '../../source/previewLine';
import { CommandIcon } from '../CommandIcon';
import { Switch } from '../Switch';
import {
  FormatSwitch,
  FrameColorPicker,
  LanguageSelect,
  PointerSelect,
  SoundControl,
  SpeedControl,
  SpotlightSizeControl,
} from './SettingControls';
import { TypingPreview } from './TypingPreview';

/** Props for {@link ControlPanel}. */
export interface ControlPanelProps {
  settings: Settings;
  isOpen: boolean;
  /** Called when the title bar is clicked. */
  onToggle(): void;
  /** Off for the experienced user: the pitch and the notes are hidden (the page hides the tooltips). */
  showHelpText: boolean;
  /** Opens the guide on its list of keys. */
  onShowAllKeys(): void;
  /** The app's key sounds, for the typing preview. */
  sounds: KeySounds;
  /** Called with the settings that changed. */
  onChange(changes: Partial<Settings>): void;
  /** Sound changes go through here so the app can play a sample. */
  onSoundLevelChange(level: number): void;
}

/**
 * Every setting at once, laid out like a mixing desk: one framed channel per
 * group, numbered in the order you work through them – which code, how it is
 * typed, how the screen looks, and how to present.
 *
 * The panel is one card: a title bar that opens and closes it (an accordion –
 * the control sits on the thing it controls), a short pitch, the channels, and
 * the tooltips. Everything that only explains – pitch, notes, tooltips – goes
 * away when help text is switched off. What you need to use the app stays: the
 * first instruction, the command summaries, and Space and Esc.
 */
export function ControlPanel(props: ControlPanelProps) {
  const { settings, isOpen, onToggle, showHelpText, onShowAllKeys, sounds, onChange, onSoundLevelChange } = props;
  const syntax = getLanguage(settings.languageId).comments;

  return (
    <section className={`panel ${isOpen ? 'panel--open' : ''}`} aria-label="Control panel">
      <Control hint="panel">
        <button className="panel__title" onClick={onToggle} aria-expanded={isOpen} aria-controls="control-panel-body">
          <Chevron />
          Control panel
          {!isOpen && <span className="panel__title-note">Show all settings</span>}
        </button>
      </Control>

      {isOpen && (
        <div id="control-panel-body">
          {showHelpText && (
            // What it is, then how – in two short lines.
            <p className="panel__pitch">
              <strong>Turn your code into a scripted presentation.</strong>
              <br />
              Automatic typing, highlights and pauses – written right in your comments.
            </p>
          )}

          <div className="panel__channels">
            <Channel number={1} title="Add your code">
              {/* The one instruction that stays when help text is off: without it the page has no starting point. */}
              <p className="channel__instruction">
                Paste your code in the <strong>box below</strong>.
              </p>
              <Control hint="language">
                <LanguageSelect value={settings.languageId} onChange={(languageId) => onChange({ languageId })} />
              </Control>
              <ScriptMarkers
                isOn={settings.scriptMarkers}
                markers={settings.markers}
                syntax={syntax}
                showHelpText={showHelpText}
                onToggle={(scriptMarkers) => onChange({ scriptMarkers })}
                onChange={(markers) => onChange({ markers })}
              />
            </Channel>

            <Channel number={2} title="Set up typing">
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
              <Control hint="lineNumbers">
                <Switch
                  label="Show line numbers"
                  checked={settings.lineNumbers}
                  onChange={(lineNumbers) => onChange({ lineNumbers })}
                />
              </Control>
            </Channel>

            {/* Everything about how the screen looks – set before you start. R, G, B, M and P can still change it live. */}
            <Channel number={3} title="Choose the look">
              <Control hint="format">
                <FormatSwitch value={settings.format} onChange={(format) => onChange({ format })} />
              </Control>
              {showHelpText && (
                <p className="channel__note">
                  Sets the shape of Presentation Mode – for full screen, or for recording with OBS.
                </p>
              )}
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
              </div>
            </Channel>

            {/* The last step: the keys you need, and the way in. */}
            <Channel number={4} title="Present">
              <EssentialKeys onShowAllKeys={onShowAllKeys} />
              {showHelpText && (
                <p className="channel__note channel__note--next">
                  When you are ready, click <strong>Start Presentation Mode</strong> – the blue button at the top right.
                </p>
              )}
            </Channel>
          </div>
        </div>
      )}
    </section>
  );
}

/** The two keys you cannot present without – always shown, help text or not. */
const ESSENTIAL_KEYS = [
  { key: 'Space', action: 'Play / pause' },
  { key: 'Esc', action: 'Exit Presentation Mode' },
] as const;

/**
 * Space and Esc, and a link to every other key. The full list (H, Z, R, G, B …)
 * lives in the guide: two keys are enough to start, and the rest are found
 * when they are needed.
 */
function EssentialKeys({ onShowAllKeys }: { onShowAllKeys(): void }) {
  return (
    <div className="key-legend">
      <p className="key-legend__title">Keys in Presentation Mode</p>
      <dl className="key-legend__keys">
        {ESSENTIAL_KEYS.map((item) => (
          <div key={item.key} className="key-legend__row">
            <dt>
              <kbd>{item.key}</kbd>
            </dt>
            <dd>{item.action}</dd>
          </div>
        ))}
      </dl>
      <button className="link-button key-legend__all" onClick={onShowAllKeys}>
        View all shortcuts
      </button>
    </div>
  );
}

const MARKER_HINTS: Record<Marker, HintId> = {
  callout: 'markerCallout',
  highlight: 'markerHighlight',
  pause: 'markerPause',
  step: 'markerStep',
};

/** What each command does, in a few words beside its switch – always shown. The tooltip has the full sentence. */
const MARKER_SUMMARIES: Record<Marker, string> = {
  callout: 'Speech bubble',
  pause: 'Typing pause',
  highlight: 'Highlight & pause',
  step: 'Step title',
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
  /** The master switch. */
  onToggle(isOn: boolean): void;
  /** One marker switched on or off. */
  onChange(markers: MarkerSwitches): void;
}

/**
 * Presentation commands (script markers in the code): the master switch, and
 * under it one row per command – its switch, its name and what it does in a few
 * words. Each command is named once; there is no separate list repeating the
 * names. With help text on, one example in the chosen language follows.
 *
 * While the master is off the marker switches are disabled and show as off,
 * because that is what they are. Each one keeps its own setting and gets it
 * back when the master comes on again.
 */
function ScriptMarkers({ isOn, markers, syntax, showHelpText, onToggle, onChange }: ScriptMarkersProps) {
  return (
    <div className="script">
      <Control hint="scriptMarkers">
        <Switch label="Presentation commands" checked={isOn} onChange={onToggle} />
      </Control>

      <div className={`script__markers ${isOn ? '' : 'script__markers--off'}`} role="group" aria-label="Commands">
        {MARKERS.map((marker) => (
          <Control key={marker} hint={MARKER_HINTS[marker]}>
            <div className="script__row">
              <Switch
                label={<code className="script__marker">{`${MARKER_PREFIX}${marker}`}</code>}
                checked={isOn && markers[marker]}
                disabled={!isOn}
                onChange={(on) => onChange({ ...markers, [marker]: on })}
              />
              <span className="script__summary">
                {MARKER_SUMMARIES[marker]}
                {/* The same icon the code box shows after a command line, so the two are easy to connect. */}
                <CommandIcon icon={marker} />
              </span>
            </div>
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

/** Props for {@link Channel}. */
interface ChannelProps {
  number: number;
  title: string;
  children: ReactNode;
}

/** One framed group of controls – a channel strip on the mixing desk, numbered and titled in its frame. */
function Channel({ number, title, children }: ChannelProps) {
  return (
    <fieldset className="channel">
      <legend className="channel__title">
        <span className="channel__number">{number}</span>
        {title}
      </legend>
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
