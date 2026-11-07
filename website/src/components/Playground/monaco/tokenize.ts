/**
 * Prism tokens colored as Monaco colors the same code, so the code the
 * server renders keeps its colors when Monaco takes over (see ./theme.ts).
 * Prism still finds strings, comments, numbers and regular expressions, which
 * Monaco colors the same way. The rest is colored here the way Monaco's
 * TypeScript, JavaScript and HTML grammars color it: keywords, capitalized
 * names, operators and brackets, tags. A few characters can still differ (an
 * apostrophe in JSX text starts a string in Monaco).
 */
import { Prism } from 'prism-react-renderer';

type Token = string | Prism.Token;

// Monaco's keyword lists (monaco-editor/esm/vs/languages/definitions/)
const JS_WORDS =
  'break case catch class continue const constructor debugger default delete do else export extends false finally for from function get if import in instanceof let new null return set static super switch symbol this throw true try typeof undefined var void while with yield async await of'.split(
    ' ',
  );
const TS_KEYWORDS = new Set([
  ...JS_WORDS,
  ...'abstract any as asserts bigint boolean declare enum implements infer interface is keyof module namespace never number object out package private protected public override readonly require global satisfies string type unique unknown'.split(
    ' ',
  ),
]);
/** JavaScript, also HTML's `<script>` */
const JS_KEYWORDS = new Set(JS_WORDS);
/** Symbol runs Monaco colors as operators; any other run stays plain */
const OPERATORS = new Set(
  '<= >= == != === !== => + - ** * / % ++ -- << </ >> >>> & | ^ ! ~ && || ?? ? : = += -= *= **= /= %= <<= >>= >>>= &= |= ^= @'.split(
    ' ',
  ),
);
/** Prism token types Monaco colors the same, by the theme type they get */
const KEPT: Record<string, string> = {
  string: 'string',
  'string-property': 'string',
  'template-punctuation': 'string',
  'interpolation-punctuation': 'punctuation',
  comment: 'comment',
  // `/** … */`
  'doc-comment': 'comment',
  regex: 'regex',
  number: 'number',
  // a JSON key, plain like a TypeScript object's
  property: 'plain',
};

export const textOf = (token: Token | Token[]): string =>
  typeof token === 'string' ? token
  : Array.isArray(token) ? token.map(textOf).join('')
  : textOf(token.content as Token | Token[]);

const contentOf = (token: Prism.Token) =>
  (Array.isArray(token.content) ? token.content : [token.content]) as Token[];

const typed = (type: string, text: string) => new Prism.Token(type, text);

/** An attribute value's text split into its leading `=` (if any) and the rest */
const splitEquals = (token: Prism.Token) =>
  textOf(token)
    .match(/^(=?)([\s\S]*)$/)!
    .slice(1);

/** Code outside strings and comments, colored as Monaco's grammar does */
function lex(code: string, keywords: Set<string>): Token[] {
  const tokens: Token[] = [];
  // Monaco's two identifier rules: a `#` joins only a lowercase name
  for (const [text, word, delimiter, symbols] of code.matchAll(
    /(#?[a-z_$][\w$]*|[A-Z][\w$]*)|([{}()[\];,.]|!(?!=))|([=><!~?:&|+\-*/^%]+)|\s+|./g,
  )) {
    if (word) {
      tokens.push(
        keywords.has(word) ? typed('keyword', word)
        : /^[A-Z]/.test(word) ? typed('class-name', word)
        : word,
      );
    } else if (
      delimiter ||
      (symbols && (/^[<>]$/.test(symbols) || OPERATORS.has(symbols)))
    ) {
      tokens.push(typed('punctuation', text));
    } else tokens.push(text);
  }
  return tokens;
}

/** Brackets of Monaco's TypeScript configuration */
const TS_BRACKETS = /^[{}()[\]]$/;

/** Consecutive pairs: [a, b, c] → [a, b], [b, c] */
const pairs = (cuts: number[]) =>
  cuts.slice(1).map((to, i) => [cuts[i], to] as const);

const isPunctuation = (token: Token | undefined, text: string) =>
  typeof token === 'object' &&
  /^(punctuation|operator)$/.test(token.type) &&
  token.content === text;

/**
 * Prism's tokens with all but the `KEPT` ones lexed again as Monaco does.
 * With `jsx`, tag names, attribute names and text get the colors TypeScript
 * gives Monaco (./jsxTokens.ts).
 */
function recolor(stream: Token[], keywords: Set<string>, jsx = false) {
  const tokens: Token[] = [];
  let code = '';
  /** Where JSX nests: an element's children, a tag's attributes, `{}` code */
  const nesting: ('children' | 'tag' | 'code')[] = [];
  /** Where JSX text is in `code`: [from, to] */
  let text: (readonly [number, number])[] = [];
  /**
   * Lexes `code` as Monaco's grammar does, with its JSX text plain as
   * TypeScript colors it, but for the brackets Monaco still colors
   */
  const flush = () => {
    const cuts = text.flat();
    const inText = (at: number) =>
      text.some(([from, to]) => at >= from && at < to);
    let offset = 0;
    // a loop, as spreading a long run of tokens overflows the stack
    for (const token of lex(code, keywords)) {
      const end = offset + textOf(token).length;
      const inner = cuts.filter(cut => cut > offset && cut < end);
      for (const [from, to] of pairs([offset, ...inner, end])) {
        const part = code.slice(from, to);
        tokens.push(
          (
            typeof token === 'string' ||
              (inText(from) && !TS_BRACKETS.test(part))
          ) ?
            part
          : typed(token.type, part),
        );
      }
      offset = end;
    }
    code = '';
    text = [];
  };
  const push = (token: Token) => {
    flush();
    tokens.push(token);
  };
  /** `<Name attr="value">` or `</Name>`, maybe without a name */
  const walkTag = (tag: Prism.Token) => {
    const [head, ...attributes] = contentOf(tag);
    const [open, name] = contentOf(head as Prism.Token);
    code += textOf(open);
    if (name) {
      const tagName = textOf(name);
      push(typed(/^[A-Z]/.test(tagName) ? 'class-name' : 'tag', tagName));
    }
    nesting.push('tag');
    for (const part of attributes) {
      if (typeof part === 'object' && part.type === 'attr-name')
        push(typed('attr-name', textOf(part)));
      else walk(part);
    }
    nesting.pop();
    if (textOf(open) === '</') {
      if (nesting.at(-1) === 'children') nesting.pop();
    } else if (textOf(attributes.at(-1) ?? '') !== '/>') {
      nesting.push('children');
    }
  };
  const walk = (token: Token) => {
    if (jsx) {
      if (typeof token === 'object' && token.type === 'tag')
        return walkTag(token);
      if (isPunctuation(token, '{')) {
        nesting.push('code');
        code += '{';
        return;
      }
      if (isPunctuation(token, '}') && nesting.at(-1) === 'code') {
        nesting.pop();
        code += '}';
        return;
      }
      // text: Monaco's grammar reads it with the code around it
      if (nesting.at(-1) === 'children') {
        const part = textOf(token);
        text.push([code.length, code.length + part.length]);
        code += part;
        return;
      }
    }
    if (typeof token === 'string') {
      code += token;
    } else if (Object.hasOwn(KEPT, token.type)) {
      push(typed(KEPT[token.type], textOf(token)));
    } else if (token.type === 'attr-value') {
      // a JSX attribute: `="value"`
      const [equals, value] = splitEquals(token);
      code += equals;
      push(typed('string', value));
    } else walkAll(contentOf(token));
  };
  const walkAll = (list: Token[]) => {
    for (let i = 0; i < list.length; i++) {
      if (jsx && isPunctuation(list[i], '<')) {
        // Prism reads a fragment's `<>` as two operators
        if (isPunctuation(list[i + 1], '>')) {
          code += '<>';
          nesting.push('children');
          i++;
          continue;
        }
        // and misses a tag right after another's `>`, but finds it when it
        // reads on from there
        if (nesting.at(-1) === 'children') {
          const again = Prism.tokenize(
            list.slice(i).map(textOf).join(''),
            Prism.languages.tsx,
          );
          if (typeof again[0] === 'object' && again[0].type === 'tag')
            return walkAll(again);
        }
      }
      walk(list[i]);
    }
  };
  walkAll(stream);
  flush();
  return tokens;
}

/**
 * HTML's `{}()` outside comments get Monaco's bracket colors (delimiter, see
 * ./theme.ts)
 */
const withBrackets = (text: string, type?: string): Token[] =>
  text
    .split(/([{}()])/)
    .filter(Boolean)
    .map(part =>
      /^[{}()]$/.test(part) ? typed('punctuation', part)
      : type ? typed(type, part)
      : part,
    );

/** Prism's markup tokens colored as Monaco's HTML grammar does */
function recolorHtml(stream: Token[], inTagName = false): Token[] {
  return stream.flatMap((token): Token[] => {
    if (typeof token === 'string') {
      return inTagName ? [typed('tag', token)] : withBrackets(token);
    }
    switch (token.type) {
      case 'comment':
      case 'punctuation':
        return [token];
      case 'script':
        return recolor([token], JS_KEYWORDS);
      case 'attr-name': {
        // Vue's `:` and `@` prefixes stay plain
        const [, prefix, name] = textOf(token).match(/^([^\w-]*)([\s\S]*)$/)!;
        return [...(prefix ? [prefix] : []), typed('attr-name', name)];
      }
      case 'attr-value': {
        const [equals, value] = splitEquals(token);
        return [
          ...(equals ? [typed('punctuation', equals)] : []),
          ...withBrackets(value, 'string'),
        ];
      }
      default: {
        // a tag's name sits beside its `<` or `</` in a nested `tag`
        const content = contentOf(token);
        return recolorHtml(
          content,
          token.type === 'tag' &&
            content.some(
              part =>
                typeof part !== 'string' &&
                part.type === 'punctuation' &&
                /^<\/?$/.test(textOf(part)),
            ),
        );
      }
    }
  });
}

/** Monaco's JavaScript grammar is its TypeScript one with fewer keywords */
const keywordsFor = (grammar: Prism.Grammar) =>
  grammar === Prism.languages.javascript || grammar === Prism.languages.jsx ?
    JS_KEYWORDS
  : TS_KEYWORDS;

/**
 * Prism, for react-live's `prism`, with its tokens colored as Monaco does.
 * Use it with ./theme.ts's `codePrismTheme`.
 */
export const monacoPrism = {
  ...Prism,
  tokenize: (code: string, grammar: Prism.Grammar) =>
    grammar === Prism.languages.markup ?
      recolorHtml(Prism.tokenize(code, grammar))
    : recolor(
        Prism.tokenize(code, grammar),
        keywordsFor(grammar),
        grammar === Prism.languages.tsx,
      ),
} as typeof Prism;
