import type { CommentSyntax } from '../models/language';
import { isMarkerOn, readMarkerLine, type LabelIcon, type Marker, type ScriptOptions } from '../models/script';

/** One piece of a label: an optional icon and the text after it. */
export interface LabelPart {
  icon?: LabelIcon;
  text: string;
}

/** A label: the pieces in reading order, e.g. [highlight icon, "highlight"], [" + "], [callout icon, "callout"]. */
export type ScriptLabel = readonly LabelPart[];

const command = (marker: Marker): LabelPart => ({ icon: marker, text: marker });

/**
 * What each marker line will do in Presentation Mode, as the label the code box
 * shows after it – so the script can be read in the code itself: an icon and the
 * command's name, `(off)` for a command that is switched off, and a warning for a
 * misspelled command or one that hides code on its line. Keyed by 1-based source
 * line; lines without a command get no label. Uses the same rules as `extractScript`.
 */
export function scriptLabels(source: string, syntax: CommentSyntax, options: ScriptOptions): Map<number, ScriptLabel> {
  const labels = new Map<number, ScriptLabel>();

  source
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .forEach((line, index) => {
      const found = readMarkerLine(line, syntax);
      if (found === null) return;

      const { marker, word, text, hidesCode } = found;
      let label: LabelPart[];
      if (marker === null) label = [{ icon: 'warning', text: `unknown command @@${word} – hidden` }];
      else if (!isMarkerOn(options, marker)) label = [{ icon: marker, text: `${marker} (off)` }];
      else if ((marker === 'highlight' || marker === 'pause') && text !== '')
        label = [command(marker), { text: ' + ' }, command('callout')];
      else label = [command(marker)];

      if (hidesCode) label.push({ text: ' · ' }, { icon: 'warning', text: 'the code on this line is hidden too' });
      labels.set(index + 1, label);
    });

  return labels;
}

/** A label as plain text, icons as `[name]` – for tests and for reading labels at a glance. */
export function labelText(label: ScriptLabel): string {
  return label.map((part) => (part.icon ? `[${part.icon}] ${part.text}` : part.text)).join('');
}
