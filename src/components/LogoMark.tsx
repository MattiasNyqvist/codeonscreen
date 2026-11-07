/**
 * The app's mark: a tilted square next to a wide frame – a prompt and a screen – in a blue-to-teal
 * gradient. The same picture as the favicon. Decorative: the name next to it says the same.
 */
export function LogoMark({ height = 30 }: { height?: number }) {
  return (
    <svg
      className="logo__mark"
      height={height}
      viewBox="180 136 262 158"
      style={{ aspectRatio: '262 / 158' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1254c0" />
          <stop offset="60%" stopColor="#028ccf" />
          <stop offset="100%" stopColor="#00b4d8" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#logo-grad)" strokeWidth="13" strokeLinejoin="miter">
        <rect x="215" y="165" width="90" height="90" transform="rotate(45 260 215)" />
        <rect x="280" y="165" width="150" height="100" />
      </g>
    </svg>
  );
}
