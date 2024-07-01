export const options = {
  scrollbar: { alwaysConsumeMouseWheel: false },
  minimap: { enabled: false },
  wordWrap: 'on',
  scrollBeyondLastLine: false,
  wrappingIndent: 'indent',
  lineNumbers: 'off',
  //glyphMargin: false,
  folding: false,
  // Undocumented see https://github.com/Microsoft/vscode/issues/30795#issuecomment-410998882
  //lineDecorationsWidth: 0,
  //lineNumbersMinChars: 0,
  fontLigatures: true,
  fontFamily:
    '"Roboto Mono",SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
  fontSize: 13,
  lineHeight: 19,
} as const;

export const largeOptions = {
  ...options,
  fontSize: 14,
  lineHeight: 20,
};
