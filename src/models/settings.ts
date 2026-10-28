import { FRAME_COLOR_CHOICES, type FrameColorChoice } from './frame';
import { LANGUAGES, type LanguageId } from './language';
import { SPEED_LIMITS } from './playback';
import { STAGE_FORMATS, type StageFormat } from './stageFormat';
import { ALL_MARKERS_ON, MARKERS, type MarkerSwitches } from './script';

/** Typing sound levels: 0 = off, 1 = barely audible … 5 = loud. */
export const MAX_SOUND_LEVEL = 5;

/** The two colour themes; one setting styles both the page and the recorded editor. */
export const THEMES = ['dark', 'light'] as const;
/** One of {@link THEMES}. */
export type Theme = (typeof THEMES)[number];

/** Radius in stage pixels of the clear circle in spotlight mode. */
export const SPOTLIGHT_RADIUS_LIMITS = {
  min: 60,
  max: 300,
  default: 112,
} as const;

/** What the mouse does on the stage. */
export const POINTER_MODES = ['off', 'laser', 'spotlight'] as const;
/** One of {@link POINTER_MODES}. */
export type PointerMode = (typeof POINTER_MODES)[number];

/** Everything the presenter configures on the setup page. Saved between visits. */
export interface Settings {
  source: string;
  languageId: LanguageId;
  speed: number;
  /** 0 = off, 1 = barely audible … 5 = loud. */
  soundLevel: number;
  frameColor: FrameColorChoice;
  /** The master switch for script markers. Comments without a marker are always typed. */
  scriptMarkers: boolean;
  /** Which script markers (`@@callout`, `@@highlight` …) are obeyed. */
  markers: MarkerSwitches;
  typos: boolean;
  theme: Theme;
  pointerMode: PointerMode;
  /** See {@link SPOTLIGHT_RADIUS_LIMITS}. */
  spotlightRadius: number;
  /** Landscape for YouTube, portrait for TikTok and Reels. */
  format: StageFormat;
  /** Show line numbers on the stage. */
  lineNumbers: boolean;
}

/**
 * The example on first visit: a small, realistic tutorial that uses every
 * script marker, so the first take shows what a script can do – `@@callout`
 * adds a speech bubble, `@@highlight` boxes a line and pauses, `@@pause` stops
 * after a line, and `@@step` titles each part. One ordinary comment is left in:
 * without a marker, a comment is code, and it is typed like code.
 */
export const DEFAULT_SOURCE = `using System;
using System.Linq;

// @@step The basket
// @@callout Unit prices in SEK for the items in the basket. decimal, not double: money must not drift.
var prices = new[] { 12.50m, 8.99m, 23.00m };

// @@callout Sum() comes from System.Linq and adds up every element in the array
var total = prices.Sum();

// @@step Add VAT
// @@highlight Swedish VAT is 25 %, so multiplying by 1.25 gives the price including tax
var totalWithVat = total * 1.25m;

// @@step Print the receipt
// Write a short receipt to the console
Console.WriteLine($"Items: {prices.Length}");

// @@callout :F2 formats the amount with exactly two decimals, e.g. 55.61
// @@pause
Console.WriteLine($"Total: {total:F2}");
// @@callout This is what the customer actually pays
Console.WriteLine($"With VAT: {totalWithVat:F2}");
`;

/** Settings on first visit, and the fallback for any stored value that is invalid. */
export const DEFAULT_SETTINGS: Settings = {
  source: DEFAULT_SOURCE,
  languageId: 'csharp',
  speed: SPEED_LIMITS.default,
  soundLevel: 0,
  frameColor: 'red',
  scriptMarkers: true,
  markers: ALL_MARKERS_ON,
  typos: false,
  theme: 'dark',
  pointerMode: 'off',
  spotlightRadius: SPOTLIGHT_RADIUS_LIMITS.default,
  format: 'landscape',
  lineNumbers: true,
};

/**
 * Turns whatever was stored (possibly from an older version, possibly edited by
 * hand) into valid settings. Each field is checked on its own, so one bad value
 * falls back to its default without losing the rest.
 */
export function parseSettings(stored: unknown): Settings {
  const value = isRecord(stored) ? stored : {};
  const pick = <T>(key: keyof Settings, isValid: (candidate: unknown) => candidate is T): T =>
    isValid(value[key]) ? value[key] : (DEFAULT_SETTINGS[key] as T);

  return {
    source: pick('source', isString),
    languageId: pick('languageId', isOneOf(LANGUAGES.map((language) => language.id))),
    speed: pick('speed', isNumberIn(SPEED_LIMITS.min, SPEED_LIMITS.max)),
    soundLevel: pick('soundLevel', isNumberIn(0, MAX_SOUND_LEVEL)),
    frameColor: pick('frameColor', isOneOf(FRAME_COLOR_CHOICES)),
    scriptMarkers: pick('scriptMarkers', isBoolean),
    markers: readMarkers(value.markers),
    typos: pick('typos', isBoolean),
    theme: pick('theme', isOneOf(THEMES)),
    pointerMode: pick('pointerMode', isOneOf(POINTER_MODES)),
    spotlightRadius: pick('spotlightRadius', isNumberIn(SPOTLIGHT_RADIUS_LIMITS.min, SPOTLIGHT_RADIUS_LIMITS.max)),
    format: pick('format', isOneOf(STAGE_FORMATS)),
    lineNumbers: pick('lineNumbers', isBoolean),
  };
}

/** Each marker switch on its own, so one bad value never turns the others off. */
function readMarkers(stored: unknown): MarkerSwitches {
  const value = isRecord(stored) ? stored : {};
  return Object.fromEntries(
    MARKERS.map((marker) => [marker, isBoolean(value[marker]) ? value[marker] : ALL_MARKERS_ON[marker]]),
  ) as MarkerSwitches;
}

/** The next value in a list, wrapping around at the end. Used for keys that cycle a setting. */
export function cycle<T>(options: readonly T[], current: T): T {
  return options[(options.indexOf(current) + 1) % options.length];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isNumberIn(min: number, max: number) {
  return (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function isOneOf<T extends string>(options: readonly T[]) {
  return (value: unknown): value is T => typeof value === 'string' && (options as readonly string[]).includes(value);
}
