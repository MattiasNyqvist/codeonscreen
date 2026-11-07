import {
  APP_TAGLINE,
  APP_VERSION,
  AUTHOR_SITE_URL,
  AUTHOR_NAME,
  AUTHOR_URL,
  BUILD_TIME,
  describeBuild,
} from '../../app';
import { Modal } from './Modal';

/** One row in the keyboard table. `keys` are shown as separate key caps. */
interface Shortcut {
  keys: string[];
  action: string;
}

/**
 * The keyboard reference. Kept as data, so adding a key means adding one line here
 * (the bindings themselves live in `App.tsx`).
 */
interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
  /** Smaller groups shown under the main list, still inside the same section. */
  subgroups?: ShortcutGroup[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'In Presentation Mode',
    shortcuts: [
      {
        keys: ['Space'],
        action:
          'Play / pause. Playing on removes the highlight box and zooms out. Does nothing once everything is typed.',
      },
      {
        keys: ['H'],
        action: 'Draws the highlight box around the line being typed. Typing finishes the line, then pauses.',
      },
      { keys: ['H', 'H'], action: 'Press again to grow the highlight box one line upwards.' },
      { keys: ['Z'], action: 'Zoom in on the highlight box, or back out.' },
      { keys: ['Mouse wheel'], action: 'While paused: scroll up to zoom in, down to zoom out – the same as Z.' },
      { keys: ['N'], action: 'New start: clear the screen and begin the take again.' },
      { keys: ['Esc'], action: 'Leave Presentation Mode.' },
    ],
    subgroups: [
      {
        title: 'Drawing (while paused)',
        shortcuts: [
          { keys: ['C'], action: 'Draw a circle. Drag on the screen. Press again to go back to selecting.' },
          { keys: ['S'], action: 'Draw a square (box).' },
          { keys: ['A'], action: 'Draw an arrow.' },
          { keys: ['L'], action: 'Draw a straight line, for example to underline.' },
          {
            keys: ['R', 'G', 'B'],
            action: 'With a drawing selected: change its colour. New drawings use the Highlight and draw colour.',
          },
          {
            keys: ['D'],
            action:
              'Delete the selected drawing (Delete and Backspace work too). Drag a drawing to move it, drag a handle to resize it.',
          },
          {
            keys: ['Enter'],
            action: 'Type text in the selected drawing. Enter again to finish. Drawings vanish when you play on.',
          },
        ],
      },
    ],
  },
  {
    title: 'Anytime',
    shortcuts: [
      {
        keys: ['R', 'G', 'B'],
        action:
          'Highlight box and drawing colour: red, green or blue. With a drawing selected, it changes that drawing too.',
      },
      { keys: ['M'], action: 'Mixed: every new highlight box gets a different colour than the last.' },
      { keys: ['P'], action: 'Pointer: none, laser or spotlight.' },
      { keys: ['T'], action: 'Dark or light theme.' },
    ],
  },
  {
    title: 'On the start page',
    shortcuts: [{ keys: ['?'], action: 'This guide.' }],
  },
];

/** The tabs of the help dialog. The app can open it on a specific one – `?` opens Keyboard. */
export type HelpTab = 'start' | 'keys' | 'recording' | 'about';

const TABS: { id: HelpTab; label: string }[] = [
  { id: 'start', label: 'How it works' },
  { id: 'keys', label: 'Keyboard' },
  { id: 'recording', label: 'Recording with OBS' },
  { id: 'about', label: 'About' },
];

/** Props for {@link HelpDialog}. */
export interface HelpDialogProps {
  isOpen: boolean;
  tab: HelpTab;
  /** Called when the user switches tab inside the dialog. */
  onTabChange(tab: HelpTab): void;
  /** Called when the user closes the dialog. */
  onClose(): void;
}

/** The guide, in tabs: how the app works, the keyboard, recording with OBS, and about. */
export function HelpDialog({ isOpen, tab, onTabChange, onClose }: HelpDialogProps) {
  return (
    <Modal isOpen={isOpen} title="Guide" onClose={onClose}>
      <div className="tabs" role="tablist">
        {TABS.map(({ id, label }) => (
          <button key={id} role="tab" aria-selected={tab === id} className="tabs__tab" onClick={() => onTabChange(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="modal__content" role="tabpanel">
        {tab === 'start' && <HowToUse />}
        {tab === 'keys' && <KeyboardReference />}
        {tab === 'recording' && <RecordingTips />}
        {tab === 'about' && <About />}
      </div>
    </Modal>
  );
}

/**
 * The process in order: your code, the optional settings, then Start. Short on purpose: the page and
 * its tooltips explain each control where it is used.
 */
function HowToUse() {
  return (
    <ol className="help-steps">
      <li>
        <strong>Paste your code</strong> in the box on the left, and choose its language with <em>Show code as</em>.
        Comments are typed like any other code – unless they hold a command.
        <span className="help-steps__extra">
          <strong>Script your presentation</strong> with commands in your comments, in any language:{' '}
          <code>@@step Add VAT</code> shows a title in the middle of the screen for a few seconds before the next part
          is typed, <code>@@callout</code> shows a note beside the next line, <code>@@subtitle</code> shows a TV-style
          subtitle at the bottom, <code>@@highlight</code> draws the highlight box around the next line and pauses, and{' '}
          <code>@@pause</code> just pauses. Text after <code>@@highlight</code> or <code>@@pause</code> becomes a
          callout too. A line with <code>@@</code> is never shown – so put the command on a line of its own. A new
          subtitle replaces the one on screen, so leave a few lines of code between two subtitles. Untick{' '}
          <em>Use commands in comments</em> to ignore them all, or untick single commands. <kbd>Space</kbd> continues
          after a pause. The example uses every command.
        </span>
      </li>
      <li>
        <strong>Settings</strong> (the panel on the right, which you can close) are optional, so you can press Start
        straight away. Choose a <em>Typing speed</em> and press <em>Preview</em> to see it. Add a{' '}
        <em>Keystroke sound</em>, and <em>Make typos and fix them</em> if it should look like a real person typing.
        Under <em>Look</em>: 16:9 for YouTube, 9:16 for TikTok, Reels and Shorts; the <em>Highlight and draw color</em>;
        the <em>Pointer style</em>; and whether to <em>Show line numbers in presentation</em> (this editor never shows
        them).
      </li>
      <li>
        <strong>Present.</strong> Click <strong>Start Presentation Mode</strong> above your code, start recording in
        OBS, and press <kbd>Space</kbd>. While paused, <kbd>H</kbd> draws the highlight box around the line,{' '}
        <kbd>Z</kbd> zooms in, and <kbd>C</kbd> <kbd>S</kbd> <kbd>A</kbd> <kbd>L</kbd> let you draw a circle, a square,
        an arrow or a line on the screen. Click a drawing to select it and press <kbd>Enter</kbd> to type text in it, or{' '}
        <kbd>D</kbd> to delete it.{' '}
        <strong>
          <kbd>Esc</kbd> brings you back.
        </strong>
      </li>
    </ol>
  );
}

function ShortcutList({ shortcuts }: { shortcuts: Shortcut[] }) {
  return (
    <dl className="shortcuts">
      {shortcuts.map(({ keys, action }) => (
        <div key={keys.join('+')} className="shortcuts__row">
          <dt>
            {keys.map((key) => (
              <kbd key={key}>{key}</kbd>
            ))}
          </dt>
          <dd>{action}</dd>
        </div>
      ))}
    </dl>
  );
}

function KeyboardReference() {
  return (
    <>
      {SHORTCUT_GROUPS.map((group) => (
        <section key={group.title} className="modal__section">
          <h3 className="modal__heading">{group.title}</h3>
          <ShortcutList shortcuts={group.shortcuts} />
          {group.subgroups?.map((sub) => (
            <div key={sub.title} className="modal__subsection">
              <h4 className="modal__subheading">{sub.title}</h4>
              <ShortcutList shortcuts={sub.shortcuts} />
            </div>
          ))}
        </section>
      ))}
      <p className="modal__note">
        Colours carry no meaning of their own. If your viewers might read red as “more important” than blue, pick one
        highlight box colour and skip Mixed.
      </p>
    </>
  );
}

function RecordingTips() {
  return (
    <ul className="help-steps">
      <li>
        <strong>Go full screen.</strong> Press <kbd>F11</kbd> in the browser so no tabs or address bar end up in the
        picture. In 16:9, a 1080p display then shows Presentation Mode exactly 1:1.
      </li>
      <li>
        <strong>9:16 is taller than most screens.</strong> Presentation Mode is 1920 pixels high, so on a 1080p display
        it is scaled down and records at about half sharpness – still readable, but softer. For crisp portrait videos
        use a 1440p or 4K display, or turn a monitor on its side. Set the OBS canvas to 1080 × 1920.
      </li>
      <li>
        <strong>9:16 keeps clear of the app buttons.</strong> Callouts appear as captions below the code, and the bottom
        is left empty, because TikTok and Reels put names and buttons there.
      </li>
      <li>
        <strong>Capture it in OBS</strong> with a Display Capture or Window Capture source that shows the browser.
      </li>
      <li>
        <strong>Typing sound</strong> comes from the browser. Record it with OBS's desktop audio, or on Windows add the
        browser as an Application Audio Capture source.
      </li>
      <li>
        <strong>Start in the right order:</strong> click <em>Start Presentation Mode</em>, start recording in OBS, then
        press <kbd>Space</kbd>. The take then begins on an empty screen.
      </li>
      <li>Your code and settings are saved in this browser only, automatically.</li>
    </ul>
  );
}

function About() {
  return (
    <div className="about">
      <p className="about__name">On Screen</p>
      <p className="about__build">{describeBuild(APP_VERSION, BUILD_TIME)}</p>
      <p className="about__tagline">{APP_TAGLINE}</p>
      <p>
        Made by{' '}
        <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer">
          Nyqvist
        </a>
        . Runs entirely in your browser – your code and settings never leave this computer unless you save them to a
        file.
      </p>
      <p className="about__copyright">
        © {BUILD_TIME.getFullYear()}{' '}
        <a href={AUTHOR_SITE_URL} target="_blank" rel="noopener noreferrer">
          {AUTHOR_NAME}
        </a>
        . All rights reserved.
      </p>
    </div>
  );
}
