/**
 * What every control on the start page does, in a teacher's words rather than a
 * developer's. Shown in a tooltip next to the control, when it is pointed at or
 * focused and help text is on.
 *
 * Each text fits three short lines and names the keyboard key, if there is one. That is
 * how people learn the shortcuts without opening the guide. Keys are written in
 * square brackets – `[H]` – and drawn as key caps (see `keyText.ts`).
 */

/** Every control that explains itself in a tooltip. */
export type HintId =
  | 'language'
  | 'scriptMarkers'
  | 'markerCallout'
  | 'markerHighlight'
  | 'markerPause'
  | 'markerStep'
  | 'speed'
  | 'sound'
  | 'typos'
  | 'lineNumbers'
  | 'preview'
  | 'format'
  | 'highlight'
  | 'pointer'
  | 'spotlight'
  | 'helpText'
  | 'theme'
  | 'guide'
  | 'start'
  | 'panel';

/** Longest text a tooltip holds – three short lines at most. */
export const MAX_HINT_LENGTH = 150;

/** The explanation for each control: what it does, in plain words. */
export const CONTROL_HINTS: Record<HintId, string> = {
  language: 'The programming language your code is written in. It decides how the code is coloured.',
  scriptMarkers:
    'Turns every command on or off. Off: the commands are ignored – but a line with @@ is still never shown.',
  markerCallout: '@@callout Your text – shows the text in a speech bubble beside the next line.',
  markerHighlight: '@@highlight – draws the highlight box around the next line, then typing pauses.',
  markerPause: '@@pause – typing stops after the next line. Press [Space] to go on.',
  markerStep: '@@step Your title – shows a step title next to the file name, until the next step.',
  speed: 'How fast the code is typed. Press Preview below to see the speed you have chosen.',
  sound: 'A keyboard click for every key that is typed. You hear a short sample when you move the slider.',
  typos: 'Now and then a wrong letter is typed, then erased and corrected – so it looks like a real person typing.',
  lineNumbers: 'Show line numbers next to the code in Presentation Mode.',
  preview:
    'Types the first line of your code with the speed, typos and sound you have chosen – without going full screen.',
  format:
    '16:9 is wide, for YouTube. 9:16 is tall, for TikTok, Reels and Shorts – the callouts then show under the code.',
  highlight:
    'The colour of the box drawn around a line. Mixed gives every box a new colour. While presenting: [R] [G] [B] [M].',
  pointer:
    'What your mouse looks like while presenting: nothing, a red laser dot, or a spotlight that darkens the rest. [P] switches.',
  spotlight: 'How big the bright circle around the mouse is. Only used when Pointer style is set to Spotlight.',
  helpText: 'Tooltips like this one, and the notes in the panel. Switch them off when you know the app.',
  theme: 'A dark or a light look – for this page and for the presentation.',
  guide: 'How it works step by step, all keys, and tips for recording with OBS.',
  start:
    'Opens your code full screen, ready to present and record. Press [Space] to start typing and [Esc] to come back.',
  panel: 'Show or hide the control panel. Hide it to get more room for your code.',
};
