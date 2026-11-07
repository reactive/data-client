/// <reference types="jest" />

import fs from 'fs';
import path from 'path';

import { MONACO_VERSION } from '../grammars';
import { codePrismTheme, tokenClass } from '../theme';
import {
  isMonacoTokenized,
  monacoPrism,
  type Token,
  tokenizeHtml,
  tokenizeJson,
  tokenizeTs,
} from '../tokenize';
// Monaco's own tokens for these snippets: monaco.editor.tokenize(code,
// language) run in the browser on a page with Monaco loaded. Run it again
// after a Monaco upgrade, and after adding a snippet
import monacoTokens from './__fixtures__/monacoTokens.json';

type MonacoLines = string[][][];

/** The theme class of each character (none for line breaks), from our tokens */
function classesOf(tokens: Token[]) {
  return tokens.flatMap(token =>
    typeof token === 'string' ?
      [...token].map(() => null)
    : [...token.content].map(char => (char === '\n' ? null : token.type)),
  );
}

/**
 * The theme class of each character, from Monaco's tokens. `htmlBrackets`:
 * monaco.editor.tokenize leaves out bracket pair colorization, which draws
 * HTML's `{}()` outside comments and strings in the delimiter color (checked
 * on the rendered editor)
 */
function monacoClassesOf(lines: MonacoLines, htmlBrackets = false) {
  return lines.flatMap((line, i) => [
    ...(i ? [null] : []),
    ...line.flatMap(([text, type]) =>
      [...text].map(char =>
        (
          htmlBrackets &&
          /[{}()]/.test(char) &&
          !/^(comment|string)/.test(type) &&
          (type === '' || type.endsWith('.html'))
        ) ?
          tokenClass('delimiter')
        : tokenClass(type),
      ),
    ),
  ]);
}

const cases = (snippets: { code: string; tokens: MonacoLines }[]) =>
  snippets.map(({ code, tokens }) => [code, tokens] as const);

describe('tokenizers', () => {
  test('copy the installed Monaco', () => {
    // the lockfile: CI's test job can't resolve monaco-editor
    const lockfile = fs.readFileSync(
      path.resolve(__dirname, '../../../../../../yarn.lock'),
      'utf8',
    );
    expect(lockfile).toContain(
      `resolution: "monaco-editor@npm:${MONACO_VERSION}"`,
    );
  });

  test.each(cases(monacoTokens.typescript))(
    'color TypeScript as Monaco does: %s',
    (code, tokens) => {
      expect(classesOf(tokenizeTs(code))).toEqual(monacoClassesOf(tokens));
    },
  );

  test.each(cases(monacoTokens.html))(
    'color HTML with embedded JavaScript as Monaco does: %s',
    (code, tokens) => {
      expect(classesOf(tokenizeHtml(code))).toEqual(
        monacoClassesOf(tokens, true),
      );
    },
  );

  test.each(cases(monacoTokens.json))(
    'color JSON as Monaco does: %s',
    (code, tokens) => {
      expect(classesOf(tokenizeJson(code))).toEqual(monacoClassesOf(tokens));
    },
  );

  test.each([
    ['tokenizeTs', tokenizeTs],
    ['tokenizeHtml', tokenizeHtml],
    ['tokenizeJson', tokenizeJson],
  ])('%s keeps every character', (_, tokenizer) => {
    for (const { code } of Object.values(monacoTokens).flat()) {
      expect(
        tokenizer(code)
          .map(token => (typeof token === 'string' ? token : token.content))
          .join(''),
      ).toBe(code);
    }
  });
});

test('leaves a script type it has no grammar for plain', () => {
  // `constructor` is a key of every object, not a MIME type
  const tokens = tokenizeHtml('<script type="constructor">\nlet x\n</script>');
  expect(tokens).toContain('\nlet x\n');
});

describe('monacoPrism', () => {
  test('covers the fence languages Monaco highlights, in any case', () => {
    for (const language of ['ts', 'TSX', 'typescript', 'html', 'json']) {
      expect(isMonacoTokenized(language)).toBe(true);
    }
    for (const language of ['js', 'bash', 'constructor', 'toString']) {
      expect(isMonacoTokenized(language)).toBe(false);
    }
  });

  test('tokenizes as prism-react-renderer calls it', () => {
    const grammar = monacoPrism.languages.tsx;
    expect(monacoPrism.tokenize('const a', grammar)).toEqual(
      tokenizeTs('const a'),
    );
  });
});

describe('tokenClass', () => {
  test('picks the most specific rule', () => {
    expect(tokenClass('type.identifier.ts')).toBe('type');
    expect(tokenClass('number.hex.ts')).toBe('number-hex');
    expect(tokenClass('delimiter.html')).toBe('delimiter-html');
    expect(tokenClass('string.key.json')).toBe('string-key-json');
    expect(tokenClass('identifier.ts')).toBeNull();
    expect(tokenClass('')).toBeNull();
  });

  test('has a theme style for every class', () => {
    const types = codePrismTheme.styles.flatMap(style => style.types);
    for (const token of [
      'keyword.ts',
      'number.hex.ts',
      'comment.doc.ts',
      'attribute.value.html',
    ]) {
      expect(types).toContain(tokenClass(token));
    }
  });
});
