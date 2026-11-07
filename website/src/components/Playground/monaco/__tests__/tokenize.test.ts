/// <reference types="jest" />

import { Prism } from 'prism-react-renderer';

import { codePrismTheme } from '../theme';
import { isMonacoTokenized, monacoPrism } from '../tokenize';

/** Each token's theme type (null for plain) and text, whitespace left out */
function spans(code: string, language: string) {
  return monacoPrism
    .tokenize(code, Prism.languages[language])
    .map(token =>
      typeof token === 'string' ?
        [null, token]
      : [token.type === 'plain' ? null : token.type, String(token.content)],
    )
    .map(([type, text]) => [type, text?.trim()])
    .filter(([, text]) => text);
}

describe('monacoPrism colors as Monaco does', () => {
  test('TypeScript keywords, capitalized names and delimiters', () => {
    expect(
      spans(
        'const user: User = await UserResource.get({ id: 1 }); // hi',
        'tsx',
      ),
    ).toEqual([
      ['keyword', 'const'],
      [null, 'user'],
      ['punctuation', ':'],
      ['class-name', 'User'],
      ['punctuation', '='],
      ['keyword', 'await'],
      ['class-name', 'UserResource'],
      ['punctuation', '.'],
      ['keyword', 'get'],
      ['punctuation', '('],
      ['punctuation', '{'],
      [null, 'id'],
      ['punctuation', ':'],
      ['number', '1'],
      ['punctuation', '}'],
      ['punctuation', ')'],
      ['punctuation', ';'],
      ['comment', '// hi'],
    ]);
  });

  test('symbol runs that are not operators stay plain', () => {
    expect(spans('!!a => <b /></b>', 'tsx')).toEqual([
      ['punctuation', '!'],
      ['punctuation', '!'],
      [null, 'a'],
      ['punctuation', '=>'],
      ['punctuation', '<'],
      [null, 'b'],
      [null, '/></'],
      [null, 'b'],
      ['punctuation', '>'],
    ]);
  });

  test('template literals and JSX attributes', () => {
    expect(spans('<Avatar src="x" alt={`a${b}`} />', 'tsx')).toEqual([
      ['punctuation', '<'],
      ['class-name', 'Avatar'],
      [null, 'src'],
      ['punctuation', '='],
      ['string', '"x"'],
      [null, 'alt'],
      ['punctuation', '='],
      ['punctuation', '{'],
      ['string', '`'],
      ['string', 'a'],
      ['punctuation', '${'],
      [null, 'b'],
      ['punctuation', '}'],
      ['string', '`'],
      ['punctuation', '}'],
      [null, '/>'],
    ]);
  });

  test('HTML with embedded JavaScript, as in Vue files', () => {
    expect(
      spans(
        '<script setup lang="ts">\nlet type = 1;\n</script>\n<p :key="a()">{{ b }}</p>',
        'html',
      ),
    ).toEqual([
      ['punctuation', '<'],
      ['tag', 'script'],
      ['attr-name', 'setup'],
      ['attr-name', 'lang'],
      ['punctuation', '='],
      ['string', '"ts"'],
      ['punctuation', '>'],
      // Monaco's JavaScript has no `type` keyword
      ['keyword', 'let'],
      [null, 'type'],
      ['punctuation', '='],
      ['number', '1'],
      ['punctuation', ';'],
      ['punctuation', '</'],
      ['tag', 'script'],
      ['punctuation', '>'],
      ['punctuation', '<'],
      ['tag', 'p'],
      [null, ':'],
      ['attr-name', 'key'],
      ['punctuation', '='],
      ['string', '"a'],
      ['punctuation', '('],
      ['punctuation', ')'],
      ['string', '"'],
      ['punctuation', '>'],
      ['punctuation', '{'],
      ['punctuation', '{'],
      [null, 'b'],
      ['punctuation', '}'],
      ['punctuation', '}'],
      ['punctuation', '</'],
      ['tag', 'p'],
      ['punctuation', '>'],
    ]);
  });

  test('JSON keys plain, values colored', () => {
    expect(spans('{"a": "b", "c": [1, true]}', 'json')).toEqual([
      ['punctuation', '{'],
      [null, '"a"'],
      ['punctuation', ':'],
      ['string', '"b"'],
      ['punctuation', ','],
      [null, '"c"'],
      ['punctuation', ':'],
      ['punctuation', '['],
      ['number', '1'],
      ['punctuation', ','],
      ['keyword', 'true'],
      ['punctuation', ']'],
      ['punctuation', '}'],
    ]);
  });

  test.each([
    ['tsx', 'const a = /x+/g.test(`${b}`); // c\n/* d */'],
    ['html', '<!-- a --><div class="b">c</div>'],
    ['json', '{"a": [1, null]}'],
  ])('keeps every character of %s', (language, code) => {
    const text = (token: string | Prism.Token): string =>
      typeof token === 'string' ? token
      : Array.isArray(token.content) ? token.content.map(text).join('')
      : text(token.content as string | Prism.Token);
    expect(
      monacoPrism.tokenize(code, Prism.languages[language]).map(text).join(''),
    ).toBe(code);
  });

  test('gives every type it emits a theme style', () => {
    const types = codePrismTheme.styles.flatMap(style => style.types);
    for (const type of [
      'comment',
      'keyword',
      'class-name',
      'attr-name',
      'number',
      'string',
      'regex',
      'punctuation',
      'tag',
    ]) {
      expect(types).toContain(type);
    }
  });
});

test('isMonacoTokenized covers the fence languages Monaco highlights', () => {
  for (const language of ['ts', 'TSX', 'typescript', 'html', 'json']) {
    expect(isMonacoTokenized(language)).toBe(true);
  }
  for (const language of ['js', 'bash', 'constructor']) {
    expect(isMonacoTokenized(language)).toBe(false);
  }
});
