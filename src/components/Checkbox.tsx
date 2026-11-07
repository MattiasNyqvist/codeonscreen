import type { ReactNode } from 'react';

/** Props for {@link Checkbox}. */
export interface CheckboxProps {
  /** Text, or text with markup such as `<code>`. */
  label: ReactNode;
  checked: boolean;
  /** Greyed out and not clickable, e.g. while the group's main checkbox is off. */
  disabled?: boolean;
  /** Called with the new state when the user ticks or unticks. */
  onChange(checked: boolean): void;
}

/**
 * A tick box, for choosing items from a list – as opposed to the `Switch`, which turns one setting on or off
 * at once. The real `<input type="checkbox">` is what is drawn, so keyboard, focus and screen readers work as usual.
 */
export function Checkbox({ label, checked, disabled = false, onChange }: CheckboxProps) {
  return (
    <label className={`check ${disabled ? 'check--disabled' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="check__label">{label}</span>
    </label>
  );
}
