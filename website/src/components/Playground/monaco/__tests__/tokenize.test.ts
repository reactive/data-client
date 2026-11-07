/// <reference types="jest" />

import { codePrismTheme, tokenClass } from '../theme';
import { type Token, tokenize, tokenizeJson } from '../tokenize';
// Monaco 0.57.0's own tokens for these snippets (monaco.editor.tokenize in
// the browser): regenerate them after a Monaco upgrade
import monacoTokens from './__fixtures__/monacoTokens.json';

/** The theme class of each character (none for line breaks), from our tokens */
function classesOf(tokens: Token[]) {
  return tokens.flatMap(token =>
    typeof token === 'string' ?
      [...token].map(() => null)
    : [...token.content].map(char => (char === '\n' ? null : token.type)),
  );
}

/** The theme class of each character, from Monaco's tokens */
function monacoClassesOf(lines: string[][][]) {
  return lines.flatMap((line, i) => [
    ...(i ? [null] : []),
    ...line.flatMap(([text, type]) => [...text].map(() => tokenClass(type))),
  ]);
}

describe('tokenize', () => {
  test.each(monacoTokens.typescript.map(({ code, tokens }) => [code, tokens]))(
    'colors TypeScript as Monaco does: %s',
    (code, tokens) => {
      expect(classesOf(tokenize(code as string))).toEqual(
        monacoClassesOf(tokens as string[][][]),
      );
    },
  );

  test.each(monacoTokens.json.map(({ code, tokens }) => [code, tokens]))(
    'colors JSON as Monaco does: %s',
    (code, tokens) => {
      expect(classesOf(tokenizeJson(code as string))).toEqual(
        monacoClassesOf(tokens as string[][][]),
      );
    },
  );

  test.each([
    ['tokenize', tokenize],
    ['tokenizeJson', tokenizeJson],
  ])('%s keeps every character', (_, tokenizer) => {
    for (const { code } of [...monacoTokens.typescript, ...monacoTokens.json]) {
      expect(
        tokenizer(code)
          .map(token => (typeof token === 'string' ? token : token.content))
          .join(''),
      ).toBe(code);
    }
  });
});

describe('tokenClass', () => {
  test('picks the most specific rule', () => {
    expect(tokenClass('type.identifier.ts')).toBe('type');
    expect(tokenClass('number.hex.ts')).toBe('number-hex');
    expect(tokenClass('string.key.json')).toBe('string-key-json');
    expect(tokenClass('identifier.ts')).toBeNull();
    expect(tokenClass('')).toBeNull();
  });

  test('has a theme style for every class', () => {
    const types = codePrismTheme.styles.flatMap(style => style.types);
    for (const token of ['keyword.ts', 'number.hex.ts', 'comment.doc.ts']) {
      expect(types).toContain(tokenClass(token));
    }
  });
});
