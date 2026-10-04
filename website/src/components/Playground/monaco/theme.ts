import type * as Monaco from 'monaco-editor';

/** Monaco theme name matching the site's Prism (palenight) code blocks. */
export const MONACO_THEME = 'prism';

// TODO: load theme from docusaurus config so we eliminate DRY violation
// see https://microsoft.github.io/monaco-editor/playground.html for full options
export function definePrismTheme(monaco: typeof Monaco) {
  monaco.editor.defineTheme(MONACO_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'number', foreground: 'f78c6c' },
      { token: 'string', foreground: 'b6d986' },
      {
        token: 'keyword',
        fontStyle: 'italic',
        foreground: '7da4f6',
      },
      // type definitions variables like const X or class X
      { token: 'type', foreground: 'ffcb6b' },
      { token: 'delimiter', foreground: 'C792EA' },

      { token: 'tag', foreground: 'FF5590' },
    ],
    colors: {
      //'editor.background': '#292d3e',
      'editor.foreground': '#bfc7d5',
      //'editor.lineHighlightBorder': '#33384d',
      'editor.inactiveSelectionBackground': '#484d5b',
    },
  });
}
