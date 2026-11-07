import type * as Monaco from 'monaco-editor';
import type { PrismTheme } from 'prism-react-renderer';

/** Monaco theme name matching the site's Prism (palenight) code blocks. */
export const MONACO_THEME = 'prism';

/** Color of code no rule colors */
const FOREGROUND = '#bfc7d5';
const PLAIN = FOREGROUND.slice(1);
const DELIMITER = 'c792ea';
const STRING = 'b6d986';
const NUMBER = 'f78c6c';
const keyword = { foreground: '7da4f6', fontStyle: 'italic' };

/**
 * The playground's code colors, by Monaco token. A rule colors its token and
 * the tokens under it (`type` colors `type.identifier.ts`). Monaco uses them,
 * and so does the code the server renders (`tokenize`), so the code keeps
 * its colors when Monaco takes over. Light and dark pages share them.
 *
 * Monaco also applies its vs-dark rules under these, which `tokenClass`
 * doesn't know: give every token vs-dark colors that `tokenize` emits a rule
 * here (as `number.hex` and the JSON rules override vs-dark's own).
 */
const rules: Monaco.editor.ITokenThemeRule[] = [
  // characters Monaco's grammar doesn't know, like `é` in JSX text
  { token: 'invalid', foreground: PLAIN },
  { token: 'comment', foreground: '697098', fontStyle: 'italic' },
  { token: 'number', foreground: NUMBER },
  { token: 'number.hex', foreground: NUMBER },
  { token: 'regexp', foreground: 'b46695' },
  { token: 'string', foreground: STRING },
  { token: 'keyword', ...keyword },
  // type definitions variables like const X or class X
  { token: 'type', foreground: 'ffcb6b' },
  { token: 'delimiter', foreground: DELIMITER },
  { token: 'tag', foreground: 'FF5590' },
  // JSON: keys plain, like a TypeScript object's
  { token: 'string.key.json', foreground: PLAIN },
  { token: 'string.value.json', foreground: STRING },
  { token: 'keyword.json', ...keyword },
];

// see https://microsoft.github.io/monaco-editor/playground.html for full options
export function definePrismTheme(monaco: typeof Monaco) {
  monaco.editor.defineTheme(MONACO_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules,
    colors: {
      //'editor.background': '#292d3e',
      'editor.foreground': FOREGROUND,
      //'editor.lineHighlightBorder': '#33384d',
      'editor.inactiveSelectionBackground': '#484d5b',
      // brackets keep the delimiter color at every depth, as `tokenize`
      // leaves them. Colors, since bracket pair colorization is a model
      // option that Monaco resets from its own config.
      ...Object.fromEntries(
        [1, 2, 3, 4, 5, 6].map(depth => [
          `editorBracketHighlight.foreground${depth}`,
          `#${DELIMITER}`,
        ]),
      ),
      'editorBracketHighlight.unexpectedBracket.foreground': `#${DELIMITER}`,
      // Diffs: highlight only the changed characters, never whole lines
      'diffEditor.insertedLineBackground': '#00000000',
      'diffEditor.removedLineBackground': '#00000000',
      'diffEditorGutter.insertedLineBackground': '#00000000',
      'diffEditorGutter.removedLineBackground': '#00000000',
      'diffEditor.insertedTextBackground': '#3fb95040',
      'diffEditor.removedTextBackground': '#f8514955',
      'diffEditor.diagonalFill': '#00000000',
    },
  });
}

/**
 * The class of the rule that colors Monaco token `token` (the most specific
 * one, as Monaco picks), or null when none does
 */
export function tokenClass(token: string): string | null {
  let best: string | null = null;
  for (const rule of rules) {
    if (
      (token === rule.token || token.startsWith(`${rule.token}.`)) &&
      (best === null || rule.token.length > best.length)
    )
      best = rule.token;
  }
  return best && best.replace(/\./g, '-');
}

/** `rules` as a prism-react-renderer theme, for `tokenClass`'s classes */
export const codePrismTheme: PrismTheme = {
  plain: { color: FOREGROUND, backgroundColor: 'transparent' },
  styles: rules.map(({ token, foreground, fontStyle }) => ({
    types: [token.replace(/\./g, '-')],
    style: {
      color: `#${foreground}`,
      ...(fontStyle && { fontStyle: fontStyle as 'italic' }),
    },
  })),
};
