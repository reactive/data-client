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
