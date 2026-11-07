import type { ReactNode } from 'react';

/** Props for {@link Switch}. */
export interface SwitchProps {
  /** Text, or text with markup such as `<code>`. */
  label: ReactNode;
  checked: boolean;
  /** Greyed out and not clickable, e.g. while a master switch is off. */
  disabled?: boolean;
  /** Called with the new state when the user toggles. */
  onChange(checked: boolean): void;
}

/** An on/off toggle. A real checkbox underneath, so it works with keyboard and screen readers. */
export function Switch({ label, checked, disabled = false, onChange }: SwitchProps) {
  return (
    <label className={`switch ${disabled ? 'switch--disabled' : ''}`}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="switch__track" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}
