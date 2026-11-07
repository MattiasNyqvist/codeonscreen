import { useRef, useState } from 'react';
import type { KeySounds } from '../../audio/keySounds';
import { useTypewriter, type TypingTarget } from '../../hooks/useTypewriter';

/** Props for {@link TypingPreview}. */
export interface TypingPreviewProps {
  /** The line to type – the first line of the user's own code. */
  text: string;
  speed: number;
  typos: boolean;
  /** The app's key sounds, already set to the chosen level. */
  sounds: KeySounds;
}

/**
 * A one-line taste of Presentation Mode inside the Typing box: the same engine,
 * speed, typos and key sounds, so you can tune them without opening the full
 * screen. The text is a plain element, not an editor – it only has to look like code.
 */
export function TypingPreview({ text, speed, typos, sounds }: TypingPreviewProps) {
  const [shown, setShown] = useState('');
  // The engine writes through this target from its timers, never during render.
  const target = useRef<TypingTarget>({
    clear: () => setShown(''),
    append: (added) => setShown((current) => current + added),
    backspace: () => setShown((current) => current.slice(0, -1)),
    focus: () => {},
  });
  const playback = useTypewriter(target, speed, { onKeystroke: (keystroke) => sounds.play(keystroke) });
  const isPlaying = playback.state === 'playing';

  const toggle = () => {
    if (isPlaying) {
      playback.stop();
      return;
    }
    // Always from the beginning: a preview that resumes mid-line tells you nothing.
    playback.stop();
    playback.play(text, { typos });
  };

  return (
    <div className="preview">
      <button className="preview__button" onClick={toggle} aria-pressed={isPlaying}>
        {isPlaying ? '■ Stop' : '▶ Preview'}
      </button>
      <code className="preview__screen" aria-live="off">
        {/* An empty box says nothing; this says what the button next to it is for. */}
        {shown === '' && !isPlaying && <span className="preview__placeholder">Press Preview to try it</span>}
        {shown}
        <span className={`preview__cursor ${isPlaying ? 'preview__cursor--typing' : ''}`} aria-hidden="true" />
      </code>
    </div>
  );
}
