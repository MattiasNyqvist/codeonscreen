import { useMemo } from 'react';
import { APP_TAGLINE, APP_VERSION, AUTHOR_NAME, AUTHOR_URL, BUILD_TIME, describeBuild } from '../../app';
import type { KeySounds } from '../../audio/keySounds';
import { useHoverHint } from '../../hooks/useHoverHint';
import type { Settings } from '../../models/settings';
import { Switch } from '../Switch';
import { ControlPanel, Control } from './ControlPanel';
import { HintTooltip } from './HintTooltip';
import { SourceEditor } from './SourceEditor';

/** Props for {@link SetupView}. */
export interface SetupViewProps {
  settings: Settings;
  isPanelOpen: boolean;
  /** Opens or closes the control panel. */
  onTogglePanel(): void;
  /** Help text on: pitch, notes and tooltips. Off: only the controls. */
  showHelpText: boolean;
  /** Switches help text on or off. */
  onHelpTextChange(show: boolean): void;
  /** Called with the settings that changed. */
  onChange(changes: Partial<Settings>): void;
  /** Sound changes go through here so the app can play a sample. */
  onSoundLevelChange(level: number): void;
  /** The app's key sounds, for the typing preview. */
  sounds: KeySounds;
  /** Opens the guide (the help dialog). */
  onOpenGuide(): void;
  /** Opens the guide on its list of keys. */
  onShowAllKeys(): void;
  /** Puts the example code back. */
  onLoadExample(): void;
  /** Empties the code box (after asking). */
  onClearCode(): void;
  /** Switches to Presentation Mode. */
  onStartPresentation(): void;
  /** True until Presentation Mode has been tried once – the Start button then gently pulses. */
  inviteToStart: boolean;
}

/**
 * The start page, top to bottom:
 *
 * 1. the header – logo and tagline, the help-text and dark-mode switches, the guide, and Start
 * 2. the control panel – every setting, grouped like a mixing desk; it opens and
 *    closes from its own title bar. Every control explains itself in a tooltip.
 * 3. your code, in a Monaco editor, under a bar that says it is yours to edit
 * 4. the status bar – author, version and build, copyright
 *
 * There is no menu bar. A menu closes after every choice, which is right for
 * commands and wrong for settings you try out one after another.
 */
export function SetupView(props: SetupViewProps) {
  const { settings, onChange } = props;
  const hasCode = settings.source.trim() !== '';
  const scriptOptions = useMemo(
    () => ({ enabled: settings.scriptMarkers, markers: settings.markers }),
    [settings.scriptMarkers, settings.markers],
  );

  // One set of tooltips for the header and the panel, so the header controls explain themselves too.
  const { hint, handlers } = useHoverHint();

  return (
    <div className="setup">
      <div className="setup__controls" {...handlers}>
        <header className="header">
          <div className="logo">
            <span className="logo__name">Code On Screen</span>
            <span className="logo__tagline">{APP_TAGLINE}</span>
          </div>

          <nav className="header__actions" aria-label="View and guide">
            <Control hint="helpText">
              <Switch label="Help text" checked={props.showHelpText} onChange={props.onHelpTextChange} />
            </Control>
            <Control hint="theme">
              <Switch
                label="Dark mode"
                checked={settings.theme === 'dark'}
                onChange={(dark) => onChange({ theme: dark ? 'dark' : 'light' })}
              />
            </Control>
            <Control hint="guide">
              <button className="header__guide" onClick={props.onOpenGuide}>
                <BookIcon />
                Guide
              </button>
            </Control>
          </nav>

          <Control hint="start">
            <button
              className={`go-button ${props.inviteToStart ? 'go-button--invite' : ''}`}
              onClick={props.onStartPresentation}
              disabled={!hasCode}
            >
              <span className="go-button__arrow" aria-hidden="true">
                ▶
              </span>
              Start Presentation Mode
            </button>
          </Control>
        </header>

        <ControlPanel
          settings={settings}
          isOpen={props.isPanelOpen}
          onToggle={props.onTogglePanel}
          showHelpText={props.showHelpText}
          onShowAllKeys={props.onShowAllKeys}
          sounds={props.sounds}
          onChange={onChange}
          onSoundLevelChange={props.onSoundLevelChange}
        />
        {props.showHelpText && hint && <HintTooltip key={hint.id} hint={hint} />}
      </div>

      <div className="setup__editor">
        {/* Says at a glance that this is a real editor and the code is yours to change. */}
        <div className="editor-bar">
          <span className="editor-bar__label">
            <PencilIcon />
            Your code – paste or write what you will present
          </span>
          <span className="editor-bar__actions">
            <button
              className="editor-bar__button editor-bar__button--quiet"
              onClick={props.onClearCode}
              disabled={!hasCode}
            >
              Clear code
            </button>
            <button className="editor-bar__button editor-bar__button--primary" onClick={props.onLoadExample}>
              Load example code
            </button>
          </span>
        </div>
        <div className="setup__editor-body">
          <SourceEditor
            language={settings.languageId}
            theme={settings.theme}
            value={settings.source}
            scriptOptions={scriptOptions}
            onChange={(source) => onChange({ source })}
            onLoadExample={props.onLoadExample}
          />
        </div>
      </div>

      <footer className="statusbar">
        <span>
          by {/* noopener/noreferrer: the new tab gets no handle back to this page. */}
          <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer">
            Nyqvist
          </a>
          {' · '}
          {describeBuild(APP_VERSION, BUILD_TIME)}
        </span>
        <span>
          © {BUILD_TIME.getFullYear()} {AUTHOR_NAME}
        </span>
      </footer>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13" />
    </svg>
  );
}
