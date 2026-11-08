export const options = {
  scrollbar: { alwaysConsumeMouseWheel: false },
  minimap: { enabled: false },
  wordWrap: 'on',
  scrollBeyondLastLine: false,
  wrappingIndent: 'indent',
  lineNumbers: 'off',
  //glyphMargin: false,
  folding: false,
  // no frame lines on the code card: the current line's box only while
  // focused, and no overview ruler
  renderLineHighlightOnlyWhenFocus: true,
  overviewRulerLanes: 0,
  overviewRulerBorder: false,
  // no indent guides: the code the server renders draws none (./tokenize.ts)
  guides: { indentation: false },
  // JSX colors (./jsxColors)
  'semanticHighlighting.enabled': true,
  // Undocumented see https://github.com/Microsoft/vscode/issues/30795#issuecomment-410998882
  //lineDecorationsWidth: 0,
  //lineNumbersMinChars: 0,
  fontLigatures: true,
  fontFamily:
    '"Roboto Mono",SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
  fontSize: 13,
  lineHeight: 19,
  // ./layout's layoutWhileShown lays the editor out instead, leaving it as
  // it was while hidden
  automaticLayout: false,
} as const;
