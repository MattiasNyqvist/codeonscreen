/** Props for {@link StartButton}. */
export interface StartButtonProps {
  /** False while the editor is empty: there is nothing to present yet. */
  canStart: boolean;
  /** Pulse gently – until Presentation Mode has been tried once. */
  invite: boolean;
  /** Called when the button is pressed. */
  onStart(): void;
}

/**
 * The one filled button on the page. It sits in step 3 of the side panel, where the process ends, pinned at
 * the bottom so it is never out of reach.
 */
export function StartButton({ canStart, invite, onStart }: StartButtonProps) {
  return (
    <button
      className={`go-button ${invite ? 'go-button--invite' : ''}`}
      onClick={onStart}
      disabled={!canStart}
      title={canStart ? undefined : 'Add some code first'}
    >
      <span className="go-button__arrow" aria-hidden="true">
        ▶
      </span>
      Start Presentation Mode
    </button>
  );
}
