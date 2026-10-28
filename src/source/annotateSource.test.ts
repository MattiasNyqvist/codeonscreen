import { describe, expect, it } from 'vitest';
import { getLanguage } from '../models/language';
import { ALL_MARKERS_ON } from '../models/script';
import { labelText, scriptLabels, type ScriptLabel } from './annotateSource';

const csharp = getLanguage('csharp').comments;
const source = '// plain\n// @@callout Look\n// @@highlight\nx();\n// @@pause Wait for it\ny();';
const allOn = { enabled: true, markers: ALL_MARKERS_ON };
const texts = (labels: Map<number, ScriptLabel>) => [...labels].map(([line, label]) => [line, labelText(label)]);

describe('scriptLabels', () => {
  it('labels every command with its icon, and no plain comment', () => {
    expect(texts(scriptLabels(source, csharp, allOn))).toEqual([
      [2, '[callout] callout'],
      [3, '[highlight] highlight'],
      [5, '[pause] pause + [callout] callout'],
    ]);
  });

  it('marks every command as off when the script is off', () => {
    const labels = scriptLabels(source, csharp, { ...allOn, enabled: false });
    expect(texts(labels).map(([, text]) => text)).toEqual([
      '[callout] callout (off)',
      '[highlight] highlight (off)',
      '[pause] pause (off)',
    ]);
  });

  it('marks a switched-off command as off', () => {
    const labels = scriptLabels(source, csharp, { ...allOn, markers: { ...ALL_MARKERS_ON, pause: false } });
    expect(labelText(labels.get(5)!)).toBe('[pause] pause (off)');
  });

  it('labels a step', () => {
    expect(texts(scriptLabels('// @@step Setup\na();', csharp, allOn))).toEqual([[1, '[step] step']]);
  });

  it('warns about a misspelled command and about code hidden with a command', () => {
    expect(labelText(scriptLabels('// @@chapter One', csharp, allOn).get(1)!)).toBe(
      '[warning] unknown command @@chapter – hidden',
    );
    expect(labelText(scriptLabels('x(); // @@pause', csharp, allOn).get(1)!)).toBe(
      '[pause] pause · [warning] the code on this line is hidden too',
    );
  });
});
