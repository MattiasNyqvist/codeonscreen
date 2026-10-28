import { useEffect, useRef, type ReactNode } from 'react';

/** Props for {@link Modal}. */
export interface ModalProps {
  isOpen: boolean;
  title: string;
  /** Called when the user closes the dialog: Esc, the close button or a click outside. */
  onClose(): void;
  children: ReactNode;
}

/**
 * A modal dialog built on the native `<dialog>` element.
 *
 * `showModal()` gives us a lot for free: the backdrop, focus kept inside the
 * dialog, Esc to close and the right roles for screen readers. React only
 * decides whether it is open; the browser does the rest.
 */
export function Modal({ isOpen, title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Sync the `isOpen` prop to the element. The dialog cannot be opened with an
  // attribute and still be modal – only `showModal()` gives the backdrop.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-label={title}
      // Fires when the browser closes the dialog itself (Esc); keeps React in sync.
      onClose={onClose}
      // A click on the backdrop lands on the <dialog> element itself, never on its content.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal__body">
        <header className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
