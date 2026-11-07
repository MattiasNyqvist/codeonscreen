/**
 * Loads Monaco from node_modules instead of a CDN, so the app works offline and
 * the build contains only what we use.
 *
 * `editor.api` is the bare editor without any languages. We then register just
 * the eleven languages the app offers. All of them except JSON are Monarch
 * tokenizers – pure syntax colouring that runs on the main thread. JSON only
 * exists as a full language service, so it brings its own web worker.
 *
 * Import this file once, before any `<Editor>` renders.
 */
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/editor/editor.api';
import 'monaco-editor/languages/definitions/csharp/register';
import 'monaco-editor/languages/definitions/css/register';
import 'monaco-editor/languages/definitions/html/register';
import 'monaco-editor/languages/definitions/javascript/register';
import 'monaco-editor/languages/definitions/powershell/register';
import 'monaco-editor/languages/definitions/python/register';
import 'monaco-editor/languages/definitions/shell/register';
import 'monaco-editor/languages/definitions/sql/register';
import 'monaco-editor/languages/definitions/typescript/register';
import 'monaco-editor/languages/definitions/xml/register';
import 'monaco-editor/language/json/monaco.contribution';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/language/json/json.worker?worker';

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    return label === 'json' ? new JsonWorker() : new EditorWorker();
  },
};

loader.config({ monaco });

// Monaco measures character widths once. The bundled font may arrive a moment
// later, so measure again when it has loaded or the cursor drifts off the text.
void document.fonts.ready.then(() => monaco.editor.remeasureFonts());

export { monaco };
