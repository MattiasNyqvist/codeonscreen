import type { ReactNode } from 'react';
import { FRAME_COLOR_CHOICES, type FrameColorChoice } from '../../models/frame';
import { LANGUAGES, type LanguageId } from '../../models/language';
import { SPEED_LIMITS, describeSpeed } from '../../models/playback';
import { STAGE_FORMATS, STAGE_FORMAT_LABELS, type StageFormat } from '../../models/stageFormat';
import { MAX_SOUND_LEVEL, SPOTLIGHT_RADIUS_LIMITS, type PointerMode } from '../../models/settings';

/*
 * Small, stateless controls for the control panel. Each takes a value and reports
 * changes – the parent decides what to do with them. None has a `title` tooltip:
 * the page's own tooltip (`HintTooltip`) explains each one, with key caps and all.
 */

/** Every control takes a value and reports a new one. */
export interface ControlProps<T> {
  value: T;
  /** Called with the value the user picked. */
  onChange(value: T): void;
}

/** Which programming language the code is coloured as, and what the editor tab is called. */
export function LanguageSelect({ value, onChange }: ControlProps<LanguageId>) {
  return (
    <label className="setting">
      <span className="setting__label">Show code as</span>
      <select value={value} onChange={(event) => onChange(event.target.value as LanguageId)}>
        {LANGUAGES.map((language) => (
          <option key={language.id} value={language.id}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Typing speed in characters per second. */
export function SpeedControl({ value, onChange }: ControlProps<number>) {
  return (
    <label className="setting">
      <span className="setting__label">Typing speed</span>
      <input
        type="range"
        min={SPEED_LIMITS.min}
        max={SPEED_LIMITS.max}
        value={value}
        aria-valuetext={`${value} characters per second, ${describeSpeed(value)}`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {/* No number here: Preview shows the speed better than "30/s" does, and every slider lines up. */}
      <span className="setting__end" aria-hidden="true" />
    </label>
  );
}

/** Typing sound level 0–5; the parent plays a sample on change. */
export function SoundControl({ value, onChange }: ControlProps<number>) {
  return (
    <label className="setting">
      <span className="setting__label">Keystroke sound</span>
      <input
        type="range"
        min={0}
        max={MAX_SOUND_LEVEL}
        step={1}
        value={value}
        aria-valuetext={value === 0 ? 'Off' : `Level ${value} of ${MAX_SOUND_LEVEL}`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {/* A speaker, struck through when off – read faster than a word, and the same in every language. */}
      <span className="setting__end">{value === 0 ? <MutedSpeakerIcon /> : <SpeakerIcon />}</span>
    </label>
  );
}

const COLOR_LABELS: Record<FrameColorChoice, string> = {
  red: 'Red',
  green: 'Green',
  blue: 'Blue',
  mix: 'Mixed colours – a new one for every highlight',
};

/** The colour of the highlight box drawn with H: red, green, blue or mixed. */
export function FrameColorPicker({ value, onChange }: ControlProps<FrameColorChoice>) {
  return (
    <div className="setting" role="radiogroup" aria-label="Highlight color">
      <span className="setting__label">Highlight color</span>
      <div className="swatches">
        {FRAME_COLOR_CHOICES.map((color) => (
          <button
            key={color}
            role="radio"
            aria-checked={color === value}
            aria-label={COLOR_LABELS[color]}
            className={`swatch swatch--${color}`}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
    </div>
  );
}

/** Props for {@link SpotlightSizeControl}. */
export interface SpotlightSizeProps extends ControlProps<number> {
  /** True when the pointer is not a spotlight – the slider stays visible so nothing jumps. */
  disabled?: boolean;
}

/** Size of the clear circle when the pointer is a spotlight. */
export function SpotlightSizeControl({ value, onChange, disabled = false }: SpotlightSizeProps) {
  return (
    <label className={`setting ${disabled ? 'setting--disabled' : ''}`}>
      <span className="setting__label">Spotlight size</span>
      <input
        type="range"
        min={SPOTLIGHT_RADIUS_LIMITS.min}
        max={SPOTLIGHT_RADIUS_LIMITS.max}
        step={4}
        value={value}
        disabled={disabled}
        aria-valuetext={`${value * 2} pixels wide`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="setting__end" aria-hidden="true" />
    </label>
  );
}

const POINTER_LABELS: Record<PointerMode, string> = { off: 'None', laser: 'Laser', spotlight: 'Spotlight' };

/** None, laser dot or spotlight in Presentation Mode. */
export function PointerSelect({ value, onChange }: ControlProps<PointerMode>) {
  return (
    <label className="setting">
      <span className="setting__label">Pointer style</span>
      <select value={value} onChange={(event) => onChange(event.target.value as PointerMode)}>
        {Object.entries(POINTER_LABELS).map(([mode, label]) => (
          <option key={mode} value={mode}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** One option of a {@link Segmented} control. */
export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Drawn before the label, e.g. a little screen in the format's shape. */
  icon?: ReactNode;
}

/** Props for {@link Segmented}. */
export interface SegmentedProps<T extends string> extends ControlProps<T> {
  /** Read out by screen readers, since the group has no visible label of its own. */
  label: string;
  options: readonly SegmentedOption<T>[];
}

/**
 * Two or three options side by side, the active one filled. Unlike a switch,
 * every choice is visible and named, so nobody has to guess what "off" means.
 */
export function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          role="radio"
          aria-checked={option.value === value}
          className="segmented__option"
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

const FORMAT_OPTIONS = STAGE_FORMATS.map((format) => ({
  value: format,
  label: STAGE_FORMAT_LABELS[format],
  icon: <span className={`format-icon format-icon--${format}`} aria-hidden="true" />,
}));

/** Landscape or portrait recording. */
export function FormatSwitch({ value, onChange }: ControlProps<StageFormat>) {
  return <Segmented label="Presentation format" options={FORMAT_OPTIONS} value={value} onChange={onChange} />;
}

function SpeakerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path fill="currentColor" strokeLinejoin="round" d="M4 9h4l5-4v14l-5-4H4z" />
      <path strokeLinecap="round" d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11" />
    </svg>
  );
}

function MutedSpeakerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" role="img">
      <title>Off</title>
      <path fill="currentColor" strokeLinejoin="round" d="M4 9h4l5-4v14l-5-4H4z" />
      <path strokeLinecap="round" d="M16 9l6 6M22 9l-6 6" />
    </svg>
  );
}
