import { describe, expect, it } from 'vitest';
import { getLanguage } from '../models/language';
import { DEFAULT_SOURCE } from '../models/settings';
import { ALL_MARKERS_ON } from '../models/script';
import { prepareSource } from './prepareSource';

const allOn = { enabled: true, markers: ALL_MARKERS_ON };

const csharp = getLanguage('csharp').comments;
const python = getLanguage('python').comments;

describe('prepareSource', () => {
  it('types plain comments as code', () => {
    const result = prepareSource('// note\nb();', csharp, allOn);
    expect(result.code).toBe('// note\nb();');
    expect(result.hints.size).toBe(0);
  });

  it('numbers callouts from the first line that is typed', () => {
    const result = prepareSource('\n\n# @@callout Print it\nprint(os.name)', python, allOn);
    expect(result.code).toBe('print(os.name)');
    expect(result.hints.get(1)).toBe('Print it');
  });

  it('moves highlights and pauses along with dropped blank lines', () => {
    const result = prepareSource('\n// @@highlight\na();\n// @@pause\nb();', csharp, allOn);
    expect(result.code).toBe('a();\nb();');
    expect([...result.highlights]).toEqual([1]);
    expect([...result.pauses]).toEqual([2]);
  });
});

describe('the built-in example', () => {
  const result = prepareSource(DEFAULT_SOURCE, csharp, allOn);
  const lines = result.code.split('\n');
  const lineOf = (start: string) => lines.findIndex((line) => line.startsWith(start)) + 1;

  it('turns every callout, highlight and pause text into a callout', () => {
    expect([...result.hints.values()]).toEqual([
      'Unit prices in SEK for the items in the basket. decimal, not double: money must not drift.',
      'Sum() comes from System.Linq and adds up every element in the array',
      'Swedish VAT is 25 %, so multiplying by 1.25 gives the price including tax',
      ':F2 formats the amount with exactly two decimals, e.g. 55.61',
      'This is what the customer actually pays',
    ]);
  });

  it('uses every marker: a highlight, a pause and three steps', () => {
    expect([...result.highlights]).toEqual([lineOf('var totalWithVat')]);
    expect([...result.pauses]).toEqual([lineOf('Console.WriteLine($"Total')]);
    expect([...result.steps]).toEqual([
      [lineOf('var prices'), 'The basket'],
      [lineOf('var totalWithVat'), 'Add VAT'],
      [lineOf('Console.WriteLine($"Items'), 'Print the receipt'],
    ]);
  });

  it('types the one plain comment as code, and no marker', () => {
    expect(result.code).toContain('// Write a short receipt to the console');
    expect(result.code).not.toContain('@@');
  });
});
