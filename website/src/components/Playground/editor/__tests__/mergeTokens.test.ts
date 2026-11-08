import type { Token, TokenInputProps } from 'prism-react-renderer';
import type { CSSProperties } from 'react';

import { isPlainToken, mergeTokens } from '../mergeTokens';

const plain = { color: '#ccc', backgroundColor: '#222' };
const styles: Record<string, CSSProperties | undefined> = {
  keyword: { color: '#00f', fontStyle: 'italic' },
  builtin: { color: '#00f', fontStyle: 'italic' },
  string: { color: '#0f0' },
  // the plain color, given again
  punctuation: { color: '#ccc' },
  marked: { color: '#ccc', textDecoration: 'underline' },
};
const getTokenProps = ({ token }: TokenInputProps) => ({
  className: `token ${token.types.join(' ')}`,
  children: token.content,
  style: styles[token.types[token.types.length - 1]],
});
const tok = (type: string, content: string): Token => ({
  types: [type],
  content,
});
const merge = (line: Token[]) =>
  mergeTokens(line, getTokenProps, plain).map(token => ({
    plain: isPlainToken(token),
    type: token.types[0],
    content: token.content,
  }));

describe('mergeTokens', () => {
  it('joins tokens that look alike, with the whitespace between them', () => {
    expect(
      merge([
        tok('keyword', 'import'),
        tok('plain', ' '),
        tok('builtin', 'type'),
        tok('plain', ' '),
        tok('string', "'a'"),
      ]),
    ).toEqual([
      { plain: false, type: 'keyword', content: 'import type ' },
      { plain: false, type: 'string', content: "'a'" },
    ]);
  });

  it('makes text the plain color draws plain', () => {
    expect(
      merge([
        tok('plain', '  '),
        tok('plain', 'foo'),
        tok('punctuation', '('),
        tok('plain', 'bar'),
        tok('punctuation', ');'),
      ]),
    ).toEqual([{ plain: true, type: 'plain', content: '  foo(bar);' }]);
  });

  it('keeps whitespace a style draws on its own', () => {
    expect(
      merge([tok('string', "'a'"), tok('marked', ' '), tok('string', "'b'")]),
    ).toEqual([
      { plain: false, type: 'string', content: "'a'" },
      { plain: false, type: 'marked', content: ' ' },
      { plain: false, type: 'string', content: "'b'" },
    ]);
  });

  it('keeps whitespace out of a token whose style shows on spaces', () => {
    expect(
      merge([tok('marked', 'x'), tok('plain', ' '), tok('marked', 'y')]),
    ).toEqual([
      { plain: false, type: 'marked', content: 'x' },
      { plain: true, type: 'plain', content: ' ' },
      { plain: false, type: 'marked', content: 'y' },
    ]);
  });

  it('leaves an empty line as it is', () => {
    const line = [{ types: ['plain'], content: '\n', empty: true }];
    expect(mergeTokens(line, getTokenProps, plain)).toEqual(line);
    expect(isPlainToken(line[0])).toBe(false);
  });

  it("compares against its theme's plain style", () => {
    const line = [tok('punctuation', '('), tok('string', "'a'")];
    expect(mergeTokens(line, getTokenProps, plain)[0].types).toEqual(['plain']);
    // another theme: another getTokenProps
    const otherGetTokenProps = (input: TokenInputProps) => getTokenProps(input);
    expect(
      mergeTokens(line, otherGetTokenProps, { color: '#fff' })[0].types,
    ).toEqual(['punctuation']);
  });

  it('keeps the text', () => {
    const line = [
      tok('plain', '  '),
      tok('keyword', 'const'),
      tok('plain', ' x '),
      tok('punctuation', '='),
      tok('plain', ' '),
      tok('string', '"y"'),
    ];
    expect(
      mergeTokens(line, getTokenProps, plain)
        .map(token => token.content)
        .join(''),
    ).toBe(line.map(token => token.content).join(''));
  });
});
