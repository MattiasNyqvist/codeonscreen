import type { LabelIcon } from '../models/script';

/**
 * The icons, as 24×24 outline paths – stroke only, no fill, as few lines as
 * will still say what they are. Used twice: as inline SVG in the control panel,
 * and as a CSS mask in the code box, where Monaco only takes text and classes.
 */
export const ICON_PATHS: Record<LabelIcon, string> = {
  // A speech bubble with a tail.
  callout: 'M4 5h16v11H10l-4 4v-4H4z',
  // The two bars of every pause button.
  pause: 'M9 5v14M15 5v14',
  // A box around a line of text – what the highlight box does.
  highlight: 'M3 6h18v12H3zM7 12h10',
  // A bookmark: where a new part begins.
  step: 'M7 3h10v18l-5-4-5 4z',
  // A warning triangle with an exclamation mark.
  warning: 'M12 3l10 18H2zM12 10v4M12 17v.5',
};

/** A command's icon, drawn in the current text colour. Decorative: the text beside it says the same. */
export function CommandIcon({ icon, size = 14 }: { icon: LabelIcon; size?: number }) {
  return (
    <svg
      className="command-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[icon]} />
    </svg>
  );
}

/** The icon as a `url(...)` for `mask-image`, so CSS can paint it in any colour. */
export function iconMaskUrl(icon: LabelIcon): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round"><path d="${ICON_PATHS[icon]}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
