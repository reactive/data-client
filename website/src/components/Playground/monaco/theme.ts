import type * as Monaco from 'monaco-editor';
import type { PrismTheme } from 'prism-react-renderer';

/** Monaco theme name matching the site's Prism (palenight) code blocks. */
export const MONACO_THEME = 'prism';

const color = {
  /** code no rule colors */
  plain: '#bfc7d5',
  comment: '#697098',
  delimiter: '#c792ea',
  keyword: '#7da4f6',
  number: '#f78c6c',
  regexp: '#b46695',
  string: '#b6d986',
  tag: '#ff5590',
  type: '#ffcb6b',
};

interface CodeRule {
  token: string;
  color: string;
  italic?: boolean;
}

/**
 * The playground's code colors, by Monaco token. A rule colors its token and
 * the tokens under it (`type` colors `type.identifier.ts`). Monaco uses them,
 * and so does the code the server renders (./tokenize.ts), so the code keeps
 * its colors when Monaco takes over. Light and dark pages share them.
 *
 * Monaco also applies its base theme's (vs-dark) rules beneath these, and
 * `tokenClass` knows only these. So every token ./tokenize.ts can emit that
 * a vs-dark rule colors needs a rule here at least as specific: vs-dark's
 * own `number.hex`, `delimiter.html`, `attribute.*`, `metatag.*` and
 * `*.json` rules are why those are listed.
 */
const rules: CodeRule[] = [
  // characters Monaco's grammar doesn't know, like `é` in JSX text
  { token: 'invalid', color: color.plain },
  { token: 'comment', color: color.comment, italic: true },
  { token: 'number', color: color.number },
  { token: 'number.hex', color: color.number },
  { token: 'regexp', color: color.regexp },
  { token: 'string', color: color.string },
  { token: 'keyword', color: color.keyword, italic: true },
  // type definitions variables like const X or class X
  { token: 'type', color: color.type },
  { token: 'delimiter', color: color.delimiter },
  // HTML, as in Vue files
  { token: 'tag', color: color.tag },
  { token: 'delimiter.html', color: color.delimiter },
  { token: 'attribute.name', color: color.type },
  { token: 'attribute.value', color: color.string },
  { token: 'metatag', color: color.tag },
  { token: 'metatag.html', color: color.tag },
  { token: 'metatag.content.html', color: color.plain },
  // JSON: keys plain, like a TypeScript object's
  { token: 'string.key.json', color: color.plain },
  { token: 'string.value.json', color: color.string },
  { token: 'keyword.json', color: color.keyword, italic: true },
];

// see https://microsoft.github.io/monaco-editor/playground.html for full options
export function definePrismTheme(monaco: typeof Monaco) {
  monaco.editor.defineTheme(MONACO_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: rules.map(rule => ({
      token: rule.token,
      foreground: rule.color.slice(1),
      ...(rule.italic && { fontStyle: 'italic' }),
    })),
    colors: {
      //'editor.background': '#292d3e',
      'editor.foreground': color.plain,
      //'editor.lineHighlightBorder': '#33384d',
      'editor.inactiveSelectionBackground': '#484d5b',
      // bracket pair colorization stays on (a model option, which Monaco
      // resets from its own config), but every depth gets the delimiter
      // color, as ./tokenize.ts draws brackets
      ...Object.fromEntries(
        [1, 2, 3, 4, 5, 6].map(depth => [
          `editorBracketHighlight.foreground${depth}`,
          color.delimiter,
        ]),
      ),
      'editorBracketHighlight.unexpectedBracket.foreground': color.delimiter,
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

/** A rule's class in the server-rendered code (`number.hex` → `number-hex`) */
const classOf = (token: string) => token.replace(/\./g, '-');

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
  return best && classOf(best);
}

/** `rules` as a prism-react-renderer theme, for `tokenClass`'s classes */
export const codePrismTheme: PrismTheme = {
  plain: { color: color.plain, backgroundColor: 'transparent' },
  styles: rules.map(rule => ({
    types: [classOf(rule.token)],
    style: {
      color: rule.color,
      ...(rule.italic && { fontStyle: 'italic' as const }),
    },
  })),
};
