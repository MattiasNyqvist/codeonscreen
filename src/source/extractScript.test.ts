import { describe, expect, it } from 'vitest';
import { getLanguage } from '../models/language';
import { ALL_MARKERS_ON } from '../models/script';
import { extractScript } from './extractScript';

const csharp = getLanguage('csharp').comments;
const python = getLanguage('python').comments;
const html = getLanguage('html').comments;
const allOn = { enabled: true, markers: ALL_MARKERS_ON };

describe('extractScript', () => {
  it('types a comment without a marker as code', () => {
    const result = extractScript('// Create the app\nvar app = Build();', csharp);
    expect(result.code).toBe('// Create the app\nvar app = Build();');
    expect(result.hints.size).toBe(0);
  });

  it('gives a callout to the next line of code, skipping blank and comment-only lines', () => {
    const result = extractScript('// @@callout Create the app\n\n// plain\nvar app = Build();', csharp);
    expect(result.code).toBe('\n// plain\nvar app = Build();');
    expect(result.hints.get(3)).toBe('Create the app');
  });

  it('finds markers the same way in every language', () => {
    expect(extractScript('# @@callout Print it\nprint(1)', python).hints.get(1)).toBe('Print it');
    expect(extractScript('<!-- @@callout Page title -->\n<h1>Hi</h1>', html).hints.get(1)).toBe('Page title');
    expect(extractScript('/// @@callout Adds numbers\nint Add();', csharp).hints.get(1)).toBe('Adds numbers');
  });

  it('hides the whole line, even with code before the marker', () => {
    const result = extractScript('a();\nb(); // @@pause\nc();', csharp);
    expect(result.code).toBe('a();\nc();');
    expect([...result.pauses]).toEqual([2]);
  });

  it('hides a misspelled marker without doing anything', () => {
    const result = extractScript('// @@calout Oops\na();', csharp);
    expect(result.code).toBe('a();');
    expect(result.hints.size).toBe(0);
  });

  it('leaves a single @, a Razor @@ and a diff header alone', () => {
    const source = '@step\ndef run(): pass\nmail("info@@example.com")\n@@ -1,3 +1,4 @@';
    expect(extractScript(source, python).code).toBe(source);
  });

  it('joins callouts for the same line and reads every marker', () => {
    const script = '// @@step Setup\n// @@callout Watch\n// @@highlight this\na();\n// @@pause\nb();';
    const result = extractScript(script, csharp, allOn);
    expect(result.code).toBe('a();\nb();');
    expect(result.steps.get(1)).toBe('Setup');
    expect(result.hints.get(1)).toBe('Watch this');
    expect([...result.highlights]).toEqual([1]);
    expect([...result.pauses]).toEqual([2]);
  });

  it('ignores every marker when the script is off, but still hides them', () => {
    const result = extractScript('// @@callout Watch\na();\n// @@pause\nb();', csharp, { ...allOn, enabled: false });
    expect(result.code).toBe('a();\nb();');
    expect(result.hints.size + result.pauses.size).toBe(0);
  });

  it('ignores a single marker that is switched off', () => {
    const markers = { ...ALL_MARKERS_ON, pause: false };
    const result = extractScript('// @@pause\na();\n// @@highlight\nb();', csharp, { ...allOn, markers });
    expect(result.pauses.size).toBe(0);
    expect([...result.highlights]).toEqual([2]);
  });
});
