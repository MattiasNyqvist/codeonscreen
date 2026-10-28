import Editor, { type OnMount } from '@monaco-editor/react';
import { useEffect, useRef, useState } from 'react';
import { MONACO_THEMES, SOURCE_EDITOR_OPTIONS } from '../../editor/editorOptions';
import { monaco } from '../../editor/monacoSetup';
import { getLanguage, type LanguageId } from '../../models/language';
import type { Theme } from '../../models/settings';
import { scriptLabels, type ScriptLabel } from '../../source/annotateSource';
import { ICON_PATHS, iconMaskUrl } from '../CommandIcon';
import type { LabelIcon } from '../../models/script';
import type { ScriptOptions } from '../../models/script';

/** Props for {@link SourceEditor}. */
export interface SourceEditorProps {
  language: LanguageId;
  theme: Theme;
  value: string;
  /** Decides what each comment's label says. */
  scriptOptions: ScriptOptions;
  /** Called with the full text after every edit. */
  onChange(value: string): void;
  /** Puts the example code back, offered when the editor is empty. */
  onLoadExample(): void;
}

/**
 * A normal, editable Monaco editor – where the code is pasted and tidied up.
 * Unlike the Presentation Mode editor this one is controlled through `value`: here a person types.
 *
 * It also shows what will happen in Presentation Mode, so nobody has to read the
 * guide to understand it: every comment that does something in the script gets a grey label.
 */
export function SourceEditor(props: SourceEditorProps) {
  const { language, theme, value, scriptOptions, onChange, onLoadExample } = props;
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<monaco.editor.IEditorDecorationsCollection | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const handleMount: OnMount = (editor) => {
    installIconStyles();
    editorRef.current = editor;
    decorationsRef.current = editor.createDecorationsCollection();
    setIsMounted(true);
  };

  useEffect(() => {
    const model = editorRef.current?.getModel();
    if (!model) return;
    // Read the model, not `value`: the child <Editor> has already applied `value` in its own
    // effect (children's effects run first), and line lengths must match what is on screen.
    const labels = scriptLabels(model.getValue(), getLanguage(language).comments, scriptOptions);
    const decorations = [...labels].flatMap(([line, parts]) => [
      commandLine(model, line),
      ...label(model, line, parts),
    ]);

    decorationsRef.current?.set(decorations);
  }, [value, language, scriptOptions, isMounted]);

  return (
    <div className="source-editor">
      {/* Which syntax colours are in use – visible but quiet. Only here: Presentation Mode has its own editor. */}
      <span className="source-editor__language">{getLanguage(language).label}</span>
      <Editor
        theme={MONACO_THEMES[theme]}
        language={language}
        value={value}
        options={SOURCE_EDITOR_OPTIONS}
        onChange={(next) => onChange(next ?? '')}
        onMount={handleMount}
      />
      {value.trim() === '' && (
        <div className="source-editor__empty">
          <p>Paste the code you want to present here.</p>
          <button onClick={onLoadExample}>Load example code</button>
        </div>
      )}
    </div>
  );
}

/**
 * Colours a command line lime, from its first character to the end. Comments are a dull green and
 * code is many colours; lime is neither, so a line that will never be shown stands out as one.
 */
function commandLine(model: monaco.editor.ITextModel, line: number): monaco.editor.IModelDeltaDecoration {
  const start = model.getLineFirstNonWhitespaceColumn(line) || 1;
  return {
    range: new monaco.Range(line, start, line, model.getLineMaxColumn(line)),
    options: { inlineClassName: 'source-command' },
  };
}

/**
 * The label after the end of a line: each icon and each piece of text is its own injected text,
 * in order. Injected text is not part of the code and cannot be selected. The range is empty (it
 * sits at the end of the line), and Monaco drops empty-range text unless `showIfCollapsed` is set.
 *
 * An icon is two no-break spaces – two characters wide in the code font – painted with the icon as
 * a CSS mask in the label colour, because Monaco only takes text and class names here.
 */
function label(
  model: monaco.editor.ITextModel,
  line: number,
  parts: ScriptLabel,
): monaco.editor.IModelDeltaDecoration[] {
  const endOfLine = model.getLineMaxColumn(line);
  const range = new monaco.Range(line, endOfLine, line, endOfLine);
  const pieces = [
    { content: '    ', inlineClassName: 'source-label' },
    ...parts.flatMap((part) => [
      ...(part.icon ? [{ content: '\u00a0\u00a0', inlineClassName: `source-icon source-icon--${part.icon}` }] : []),
      { content: part.icon ? ` ${part.text}` : part.text, inlineClassName: 'source-label' },
    ]),
  ];
  return pieces.map((after) => ({ range, options: { showIfCollapsed: true, after } }));
}

/** One rule per icon, so CSS can paint each label icon with its mask. Added to the page once. */
function installIconStyles() {
  if (document.getElementById('source-icon-styles')) return;
  const style = document.createElement('style');
  style.id = 'source-icon-styles';
  style.textContent = (Object.keys(ICON_PATHS) as LabelIcon[])
    .map((icon) => `.source-icon--${icon} { mask-image: ${iconMaskUrl(icon)}; }`)
    .join('\n');
  document.head.append(style);
}
