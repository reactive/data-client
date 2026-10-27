export const options = {
  scrollbar: { alwaysConsumeMouseWheel: false },
  minimap: { enabled: false },
  wordWrap: 'on',
  scrollBeyondLastLine: false,
  wrappingIndent: 'indent',
  lineNumbers: 'off',
  //glyphMargin: false,
  folding: false,
  // no frame lines on the code card until someone edits: the current line's
  // box shows only with focus, and the scrollbar's ruler never
  renderLineHighlightOnlyWhenFocus: true,
  overviewRulerLanes: 0,
  overviewRulerBorder: false,
  // Undocumented see https://github.com/Microsoft/vscode/issues/30795#issuecomment-410998882
  //lineDecorationsWidth: 0,
  //lineNumbersMinChars: 0,
  fontLigatures: true,
  fontFamily:
    '"Roboto Mono",SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
  fontSize: 13,
  lineHeight: 19,
  // @monaco-editor/react's default; explicit because useAutoHeight's
  // resize→rewrap→getContentHeight flow depends on it
  automaticLayout: true,
} as const;
