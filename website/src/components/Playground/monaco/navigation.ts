import type * as Monaco from 'monaco-editor';

import { siblingFilePaths } from './modelPath';

/** Packages offered when completing a bare `from '…'` specifier. */
const SUGGESTED_DEPENDENCIES = [
  'react',
  '@data-client/rest',
  '@data-client/react',
  '@data-client/graphql',
  'bignumber.js',
];

/**
 * How each editor shows its own tab. Focus can't do this for a closed tab:
 * browsers won't focus inside a display:none subtree. `reveal` must show the
 * tab synchronously (e.g. via flushSync) so the editor can be focused next.
 */
const tabRevealers = new WeakMap<Monaco.editor.ICodeEditor, () => void>();

export function setTabRevealer(
  editor: Monaco.editor.ICodeEditor,
  reveal: () => void,
) {
  tabRevealers.set(editor, reveal);
}

/**
 * Cross-tab go-to-definition: reveal the tab of the editor that owns the
 * target model, then select the definition and focus it.
 */
export function registerEditorOpener(monaco: typeof Monaco) {
  monaco.editor.registerEditorOpener({
    openCodeEditor(
      _sourceEditor: Monaco.editor.ICodeEditor,
      resource: Monaco.Uri,
      selectionOrPosition?: Monaco.IRange | Monaco.IPosition,
    ) {
      if (!resource.path.startsWith('/')) return false;

      const model = monaco.editor.getModel(resource);
      const destinationEditor = monaco.editor
        .getEditors()
        .find(
          (editor: Monaco.editor.ICodeEditor) => editor.getModel() === model,
        );
      if (!destinationEditor) return false;
      tabRevealers.get(destinationEditor)?.();
      requestIdleCallback(() => {
        if (monaco.Range.isIRange(selectionOrPosition)) {
          destinationEditor.revealRangeInCenterIfOutsideViewport(
            selectionOrPosition,
          );
          destinationEditor.setSelection(selectionOrPosition);
        } else if (selectionOrPosition) {
          destinationEditor.revealPositionInCenterIfOutsideViewport(
            selectionOrPosition,
          );
          destinationEditor.setPosition(selectionOrPosition);
        }
        destinationEditor.focus();
        revealCursorOnPage(destinationEditor);
      });

      return true;
    },
  });
}

/**
 * Playground editors grow to fit their content, so the page scrolls rather
 * than the editor; center the cursor line in the window when it's offscreen.
 */
function revealCursorOnPage(editor: Monaco.editor.ICodeEditor) {
  const position = editor.getPosition();
  const cursor = position && editor.getScrolledVisiblePosition(position);
  const node = editor.getDomNode();
  if (!cursor || !node) return;
  const top = node.getBoundingClientRect().top + cursor.top;
  if (top >= 0 && top + cursor.height <= window.innerHeight) return;
  window.scrollBy({ top: top - window.innerHeight / 2, behavior: 'smooth' });
}

/**
 * Completes import specifiers: relative paths list the other files in the
 * same playground, bare specifiers list SUGGESTED_DEPENDENCIES.
 */
export function registerImportCompletions(monaco: typeof Monaco) {
  monaco.languages.registerCompletionItemProvider('typescript', {
    triggerCharacters: ["'", '"', '.', '/'],
    provideCompletionItems: (
      model: Monaco.editor.ITextModel,
      position: Monaco.Position,
    ) => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      // Match things like `from "` and `require("`
      if (
        !/(([\s|\n]+from\s+)|(\brequire\b\s*\())["|'][^'^"]*$/.test(
          textUntilPosition,
        )
      ) {
        return { suggestions: [] };
      }

      if (textUntilPosition.endsWith('.') || textUntilPosition.endsWith('/')) {
        return {
          suggestions: siblingFilePaths(
            model.uri.path,
            monaco.editor
              .getModels()
              .map(
                (editorModel: Monaco.editor.ITextModel) => editorModel.uri.path,
              ),
          ).map((file: string) => ({
            // Show the full file path for label
            label: file,
            // Don't keep extension for JS files
            insertText: file.replace(/\.tsx?$/, ''),
            kind: monaco.languages.CompletionItemKind.Module,
            range,
          })),
        };
      }
      // User is trying to import a dependency
      return {
        suggestions: SUGGESTED_DEPENDENCIES.map(name => ({
          label: name,
          kind: monaco.languages.CompletionItemKind.Module,
          insertText: name,
          range,
        })),
      };
    },
  });
}
