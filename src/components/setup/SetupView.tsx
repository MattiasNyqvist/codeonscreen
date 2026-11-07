import { useMemo } from 'react';
import {
  APP_TAGLINE,
  APP_VERSION,
  AUTHOR_SITE_URL,
  AUTHOR_NAME,
  BUILD_TIME,
  FEEDBACK_URL,
  describeBuild,
} from '../../app';
import type { KeySounds } from '../../audio/keySounds';
import { useHoverHint } from '../../hooks/useHoverHint';
import type { Settings } from '../../models/settings';
import { Switch } from '../Switch';
import { LogoMark } from '../LogoMark';
import { ControlPanel, Control } from './ControlPanel';
import { StartButton } from './StartButton';
import { LanguageSelect } from './SettingControls';
import { HintTooltip } from './HintTooltip';
import { SourceEditor } from './SourceEditor';

/** Props for {@link SetupView}. */
export interface SetupViewProps {
  settings: Settings;
  /** The settings panel is open; closed, the code has the whole width. */
  isPanelOpen: boolean;
  /** Opens or closes the settings panel. */
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
 * 1. the header – logo and tagline, the help-text and dark-mode switches, and the guide
 * 2. the code on the left, under a bar with its title, the language, Clear code and the Start button;
 *    the settings on the right, in a panel that opens and closes. Every control explains itself in a tooltip.
 * 3. the status bar – version, privacy note, feedback, copyright
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
    <div className="setup" {...handlers}>
      <header className="header">
        <div className="logo">
          <LogoMark />
          <div className="logo__text">
            <span className="logo__name">On Screen</span>
            <span className="logo__tagline">{APP_TAGLINE}</span>
          </div>
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
      </header>

      <div className={`setup__main ${props.isPanelOpen ? '' : 'setup__main--panel-closed'}`}>
        {/* The code: the one thing the app cannot do without, with Start beside it. */}
        <section className="setup__editor" aria-label="Your code">
          <div className="editor-bar">
            <h2 className="editor-bar__title">Paste your code</h2>
            {/* The language and Clear belong to the code, so they sit right beside its title. */}
            <span className="editor-bar__actions">
              <Control hint="language">
                <LanguageSelect value={settings.languageId} onChange={(languageId) => onChange({ languageId })} />
              </Control>
              <button
                className="editor-bar__button editor-bar__button--quiet"
                onClick={props.onClearCode}
                disabled={!hasCode}
              >
                Clear code
              </button>
            </span>
            {/* The one filled button on the page, where the code ends and the presenting begins. */}
            <span className="editor-bar__start">
              <Control hint="start">
                <StartButton canStart={hasCode} invite={props.inviteToStart} onStart={props.onStartPresentation} />
              </Control>
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
        </section>

        <ControlPanel
          settings={settings}
          isOpen={props.isPanelOpen}
          onToggle={props.onTogglePanel}
          showHelpText={props.showHelpText}
          sounds={props.sounds}
          onChange={onChange}
          onSoundLevelChange={props.onSoundLevelChange}
        />
      </div>
      {props.showHelpText && hint && <HintTooltip key={hint.id} hint={hint} />}

      <footer className="statusbar">
        <span>
          <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">
            Send feedback
          </a>{' '}
          · {describeBuild(APP_VERSION, BUILD_TIME)}
        </span>
        <span className="statusbar__note">Runs in your browser – your code is never uploaded.</span>
        <span>
          © {BUILD_TIME.getFullYear()}{' '}
          <a href={AUTHOR_SITE_URL} target="_blank" rel="noopener noreferrer">
            {AUTHOR_NAME}
          </a>
        </span>
      </footer>
    </div>
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
