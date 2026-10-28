import type { editor } from 'monaco-editor';
import type { Theme } from '../models/settings';
import type { StageLayout } from '../models/stageFormat';

/** Bundled with @fontsource, so every machine records the same font. */
export const CODE_FONT = "'JetBrains Mono', monospace";

/** Monaco's built-in themes that match the app's dark and light modes. */
export const MONACO_THEMES: Record<Theme, string> = {
  dark: 'vs-dark',
  light: 'vs',
};

/**
 * Shared by both editors. Ligatures are off on purpose: a beginner watching
 * `=>` turn into an arrow cannot tell which keys to press.
 */
const COMMON_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  fontFamily: CODE_FONT,
  fontLigatures: false,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  // Pasted snippets and half-typed code are never "valid"; red squiggles only distract.
  renderValidationDecorations: 'off',
  automaticLayout: true,
};

/** The editor on the setup page – a normal, editable editor. */
export const SOURCE_EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  ...COMMON_OPTIONS,
  fontSize: 14,
  lineHeight: 22,
  padding: { top: 12 },
  // No frame around the cursor's line: the grey script labels are enough to look at.
  renderLineHighlight: 'none',
};

/**
 * The editor on the stage – tuned for presenting: big font, nothing but the code.
 * Font size comes from the stage format; line numbers are a setting.
 *
 * It is not `readOnly`, because then the cursor stops blinking. `domReadOnly`
 * blocks the keyboard but keeps a live cursor.
 */
export function stageEditorOptions(
  layout: StageLayout,
  lineNumbers: boolean,
): editor.IStandaloneEditorConstructionOptions {
  return {
    ...STAGE_BASE_OPTIONS,
    fontSize: layout.fontSize,
    lineHeight: layout.lineHeight,
    lineNumbers: lineNumbers ? 'on' : 'off',
    // Without numbers, leave a little air between the edge and the code.
    lineDecorationsWidth: lineNumbers ? 10 : 24,
  };
}

const STAGE_BASE_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  ...COMMON_OPTIONS,
  padding: { top: 20, bottom: 20 },

  readOnly: false,
  domReadOnly: true,
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  cursorStyle: 'line',
  cursorWidth: 2,

  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  renderLineHighlight: 'none',
  occurrencesHighlight: 'off',
  selectionHighlight: false,
  matchBrackets: 'never',
  quickSuggestions: false,
  suggestOnTriggerCharacters: false,
  parameterHints: { enabled: false },
  hover: { enabled: 'off' },
  codeLens: false,
  contextmenu: false,
  folding: false,
  stickyScroll: { enabled: false },
  guides: { indentation: true, bracketPairs: false },
  scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
};
