/** Facts about the app itself: the logo text, the status bar and Help → About. */

/** The line under the logo. */
export const APP_TAGLINE = "Don't just type your code. Present it.";

/** From package.json – bump it there, never here. */
export const APP_VERSION: string = __APP_VERSION__;

/** When this bundle was built. Two builds of the same version still differ here. */
export const BUILD_TIME = new Date(__BUILD_TIME__);

/** Who made it, for the copyright line. */
export const AUTHOR_NAME = 'Mattias Nyqvist';

/** The author's name in the copyright line links here. */
export const AUTHOR_SITE_URL = 'https://MattiasNyqvist.github.io';

/** Where bug reports and ideas go. */
export const FEEDBACK_URL = 'https://github.com/MattiasNyqvist/codeonscreen/issues';

/** Where "by Nyqvist" links to. Only on the start page and in About, never in Presentation Mode. */
export const AUTHOR_URL = 'https://www.nyqvist.net';

/**
 * "v1.0 · build 261023.2258" – major and minor version (the patch number is left out) and the
 * build time as yymmdd.hhmm in the viewer's local time. The build time is what tells two builds
 * of the same version apart.
 */
export function describeBuild(version: string, builtAt: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const date = `${pad(builtAt.getFullYear() % 100)}${pad(builtAt.getMonth() + 1)}${pad(builtAt.getDate())}`;
  const time = `${pad(builtAt.getHours())}${pad(builtAt.getMinutes())}`;
  const [major, minor] = version.split('.');
  return `v${major}.${minor} · build ${date}.${time}`;
}
