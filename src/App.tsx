import { useEffect, useRef, useState } from 'react';
import { KeySounds } from './audio/keySounds';
import { HelpDialog, type HelpTab } from './components/dialogs/HelpDialog';
import { SetupView } from './components/setup/SetupView';
import type { CodeStageHandle } from './components/stage/CodeStage';
import { StageView } from './components/stage/StageView';
import { useKeyboardShortcuts, type KeyBindings } from './hooks/useKeyboardShortcuts';
import { usePresenter } from './hooks/usePresenter';
import { useSettings } from './hooks/useSettings';
import { useStoredFlag } from './hooks/useStoredFlag';
import { FRAME_COLOR_CHOICES } from './models/frame';
import { DEFAULT_SETTINGS, POINTER_MODES, THEMES, cycle } from './models/settings';

/** `stage` is Presentation Mode in the UI – the code keeps the shorter name. */
type View = 'setup' | 'stage';
type Dialog = 'help' | null;

/**
 * The root: owns the settings, which view is showing, dialogs and the keyboard
 * map. Everything that happens in Presentation Mode lives in {@link usePresenter}.
 */
export default function App() {
  const [settings, updateSettings] = useSettings();
  const [view, setView] = useState<View>('setup');
  // No welcome dialog: the control panel and its tooltips explain the app where it is used.
  const [dialog, setDialog] = useState<Dialog>(null);
  const [helpTab, setHelpTab] = useState<HelpTab>('start');
  // The Start button pulses until Presentation Mode has been tried once.
  const [hasPlayedOnce, setPlayedOnce] = useStoredFlag('code-on-screen.played-once', false);
  // Open by default: seeing every setting at once is how a newcomer learns what the app can do.
  const [isPanelOpen, setPanelOpen] = useStoredFlag('code-on-screen.control-panel-open', true);
  // On for newcomers. The experienced switch it off and get the room back.
  const [showHelpText, setShowHelpText] = useStoredFlag('code-on-screen.help-text', true);
  const [sounds] = useState(() => new KeySounds());
  const stageRef = useRef<CodeStageHandle>(null);
  const presenter = usePresenter(stageRef, settings, sounds);

  useEffect(() => sounds.setLevel(settings.soundLevel), [sounds, settings.soundLevel]);

  // The theme lives on <html> so CSS variables switch for the whole page.
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  const startPresentation = () => {
    if (settings.source.trim() !== '') setView('stage');
  };

  const leavePresentationMode = () => {
    presenter.stop();
    setView('setup');
  };

  const togglePlay = () => {
    if (!hasPlayedOnce) setPlayedOnce(true);
    presenter.togglePlay();
  };

  const loadExample = () =>
    updateSettings({ source: DEFAULT_SETTINGS.source, languageId: DEFAULT_SETTINGS.languageId });

  /** Clearing throws the code away, so it asks first – there is no other copy of it. */
  const clearCode = () => {
    if (window.confirm('Clear all your code?')) updateSettings({ source: '' });
  };

  const openHelp = (tab: HelpTab) => {
    setHelpTab(tab);
    setDialog('help');
  };

  /** Sets the volume and plays a two-second sample so you can hear the level. */
  const changeSoundLevel = (level: number) => {
    updateSettings({ soundLevel: level });
    sounds.setLevel(level);
    void sounds.preview();
  };

  // Setting keys work everywhere, Presentation Mode keys only there, and none at all
  // while a dialog is open – it has its own keys (Tab, Esc).
  const settingKeys: KeyBindings = {
    t: () => updateSettings({ theme: cycle(THEMES, settings.theme) }),
    // P for Pointer. Starting Presentation Mode has no key: the big blue button is the way in.
    p: () => updateSettings({ pointerMode: cycle(POINTER_MODES, settings.pointerMode) }),
    // R, G, B and M – the first letter of each choice.
    ...Object.fromEntries(FRAME_COLOR_CHOICES.map((color) => [color[0], () => updateSettings({ frameColor: color })])),
  };

  const stageKeys: KeyBindings = {
    // Esc leaves, as in every presentation app. N is a new start: the take begins again.
    Escape: leavePresentationMode,
    ' ': togglePlay,
    n: presenter.stop,
    h: presenter.frameOrGrow,
    z: presenter.toggleZoom,
  };

  const setupKeys: KeyBindings = {
    '?': () => openHelp('keys'),
  };

  const activeKeys: KeyBindings =
    dialog !== null ? {} : view === 'stage' ? { ...settingKeys, ...stageKeys } : { ...settingKeys, ...setupKeys };
  useKeyboardShortcuts(activeKeys);

  if (view === 'stage') {
    return (
      <StageView
        stageRef={stageRef}
        languageId={settings.languageId}
        theme={settings.theme}
        pointerMode={settings.pointerMode}
        spotlightRadius={settings.spotlightRadius}
        state={presenter.state}
        frame={presenter.frame}
        hints={presenter.hints}
        zoomRange={presenter.zoomRange}
        typingLine={presenter.typingLine}
        step={presenter.step}
        format={settings.format}
        lineNumbers={settings.lineNumbers}
        showStartHint={showHelpText}
      />
    );
  }

  return (
    <>
      <SetupView
        settings={settings}
        isPanelOpen={isPanelOpen}
        onTogglePanel={() => setPanelOpen(!isPanelOpen)}
        onChange={updateSettings}
        onSoundLevelChange={changeSoundLevel}
        showHelpText={showHelpText}
        onHelpTextChange={setShowHelpText}
        sounds={sounds}
        onOpenGuide={() => openHelp('start')}
        onShowAllKeys={() => openHelp('keys')}
        onLoadExample={loadExample}
        onClearCode={clearCode}
        onStartPresentation={startPresentation}
        inviteToStart={!hasPlayedOnce}
      />
      <HelpDialog isOpen={dialog === 'help'} tab={helpTab} onTabChange={setHelpTab} onClose={() => setDialog(null)} />
    </>
  );
}
