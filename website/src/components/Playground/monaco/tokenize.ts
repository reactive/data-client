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

import {
  isComponentName,
  JSX_ATTRIBUTE,
  JSX_TAG,
  JSX_TEXT,
} from './jsxColors/spans';

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
  token.type === 'punctuation' &&
  token.content === text;

/**
 * Lexes code as Monaco's grammar does, in runs between tokens colored
 * already. JSX text goes in with the code around it, as Monaco's grammar
 * reads it, but comes out plain, as TypeScript colors it, except for the
 * brackets Monaco still colors.
 */
class MonacoLexer {
  private readonly tokens: Token[] = [];
  private code = '';
  /** Length of the code in `tokens` */
  private lexed = 0;
  /** Where JSX text is in `code`: [from, to] */
  private textRanges: (readonly [number, number])[] = [];

  constructor(private readonly keywords: Set<string>) {}

  /** Where the next code goes in the whole */
  get at() {
    return this.lexed + this.code.length;
  }

  addCode(code: string) {
    this.code += code;
  }

  addText(text: string) {
    this.textRanges.push([this.code.length, this.code.length + text.length]);
    this.code += text;
  }

  /** A token colored already */
  addToken(token: Token) {
    this.flush();
    this.tokens.push(token);
    this.lexed += textOf(token).length;
  }

  result() {
    this.flush();
    return this.tokens;
  }

  private flush() {
    const { code, textRanges } = this;
    this.lexed += code.length;
    if (!textRanges.length) {
      // a loop, as spreading a long run of tokens overflows the stack
      for (const token of lex(code, this.keywords)) this.tokens.push(token);
      this.code = '';
      return;
    }
    const cuts = textRanges.flat();
    const inText = (at: number) =>
      textRanges.some(([from, to]) => at >= from && at < to);
    let offset = 0;
    // a loop, as spreading a long run of tokens overflows the stack
    for (const token of lex(code, this.keywords)) {
      const end = offset + textOf(token).length;
      const inner = cuts.filter(cut => cut > offset && cut < end);
      for (const [from, to] of pairs([offset, ...inner, end])) {
        const part = code.slice(from, to);
        this.tokens.push(
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
    this.code = '';
    this.textRanges = [];
  }
}

/** One identifier character, which may be two UTF-16 code units */
const NAME_CHAR = /^[\p{ID_Continue}$]$/u;

/** Words after which `<` starts an expression: a JSX element. `of` isn't
 * one, as `of<T>()` calls a function more often than `for (x of <a />)`
 * loops over an element */
const BEFORE_EXPRESSION = new Set(
  'await case default delete do else in instanceof new return throw typeof void yield'.split(
    ' ',
  ),
);

/**
 * Whether an opening tag Prism found at `at` in `code` reads as type
 * arguments, as `f<T>()` and `f <T>()` do: in code, after a name that isn't
 * a word like `return`. A fragment (no `name`) never does.
 */
function isTypeArguments(code: string, at: number, name: string) {
  if (!name) return false;
  // spaces on the same line: a name ending the line before can end a comment
  let end = at;
  while (code[end - 1] === ' ' || code[end - 1] === '\t') end--;
  let start = end;
  while (start > 0) {
    // a character past U+FFFF is two code units: test them together
    const step = start > 1 && /[\uDC00-\uDFFF]/.test(code[start - 1]) ? 2 : 1;
    if (!NAME_CHAR.test(code.slice(start - step, start))) break;
    start -= step;
  }
  return start < end && !BEFORE_EXPRESSION.has(code.slice(start, end));
}

/**
 * Whether a tag is type parameters, as TypeScript decides in .tsx: `<T extends`
 * (maybe `<const T extends`) starts a generic arrow function, unless the next
 * token makes `extends` an attribute (`=`, `>` or `/`). JSX children have
 * none: there `<` always starts an element.
 */
function isTypeParameters(name: string, attributes: Token[]) {
  // only a plain name: `<a.B extends` and `<svg:a extends` are tags
  const isName = (text: string) => /^[A-Za-z_$][\w$]*$/.test(text);
  if (!isName(name)) return false;
  const parts = attributes.filter(part => textOf(part).trim());
  if (name === 'const' && !isName(textOf(parts.shift() ?? ''))) return false;
  const [first, next] = parts;
  return (
    typeof first === 'object' &&
    first.type === 'attr-name' &&
    textOf(first) === 'extends' &&
    next !== undefined &&
    !/^[=>/]/.test(textOf(next))
  );
}

/**
 * Prism's tokens with all but the `KEPT` ones lexed again as Monaco does.
 * Given the tsx source `code`, tag names, attribute names and text get the
 * colors TypeScript gives them.
 */
function recolor(stream: Token[], keywords: Set<string>, code?: string) {
  const jsx = code !== undefined;
  /** Where each tag name, attribute name and text is: a start, length and kind */
  const spans: number[] = [];
  const lexer = new MonacoLexer(keywords);
  /** Where JSX nests: an element's children, or code (`{}`, a tag's attributes) */
  const nesting: ('children' | 'code')[] = [];
  /** `<Name attr="value">` or `</Name>`, maybe without a name */
  const walkTag = (tag: Prism.Token) => {
    const [head, ...attributes] = contentOf(tag);
    // a name can come in parts: `svg:` (namespace) and `path`
    const [open, ...nameParts] = contentOf(head as Prism.Token);
    const name = textOf(nameParts);
    const opener = textOf(open);
    // in JSX children, `<` always starts an element
    if (
      nesting.at(-1) !== 'children' &&
      ((opener === '<' && isTypeArguments(code ?? '', lexer.at, name)) ||
        isTypeParameters(name, attributes))
    ) {
      // read again as TypeScript, so numbers in a constraint keep their color
      return walkAll(Prism.tokenize(textOf(tag), Prism.languages.typescript));
    }
    lexer.addCode(opener);
    if (name) {
      spans.push(lexer.at, name.length, JSX_TAG);
      lexer.addToken(typed(isComponentName(name) ? 'class-name' : 'tag', name));
    }
    nesting.push('code');
    for (const part of attributes) {
      if (typeof part === 'object' && part.type === 'attr-name') {
        const attribute = textOf(part);
        spans.push(lexer.at, attribute.length, JSX_ATTRIBUTE);
        lexer.addToken(typed('attr-name', attribute));
      } else walk(part);
    }
    nesting.pop();
    if (opener === '</') {
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
        return lexer.addCode('{');
      }
      if (isPunctuation(token, '}') && nesting.at(-1) === 'code') {
        nesting.pop();
        return lexer.addCode('}');
      }
      if (nesting.at(-1) === 'children') {
        const text = textOf(token);
        spans.push(lexer.at, text.length, JSX_TEXT);
        return lexer.addText(text);
      }
    }
    if (typeof token === 'string') {
      lexer.addCode(token);
    } else if (Object.hasOwn(KEPT, token.type)) {
      lexer.addToken(typed(KEPT[token.type], textOf(token)));
    } else if (token.type === 'attr-value') {
      // a JSX attribute: `="value"`
      const [equals, value] = splitEquals(token);
      lexer.addCode(equals);
      lexer.addToken(typed('string', value));
    } else walkAll(contentOf(token));
  };
  const walkAll = (list: Token[]) => {
    for (const token of list) walk(token);
  };
  walkAll(stream);
  return { tokens: lexer.result(), spans };
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
        return recolor([token], JS_KEYWORDS).tokens;
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

const tagOf = (language: 'jsx' | 'tsx') =>
  (Prism.languages[language] as unknown as { tag: { pattern: RegExp } }).tag;

/**
 * Prism's tsx grammar, but with jsx's tag pattern, which finds a tag right
 * after another's `>` (`<li><b>`) or after text (`by<b>`). tsx's pattern
 * needs a character before the `<` that isn't a word's, so it misses those;
 * `isTypeArguments` makes that call instead, where it holds: in code. The
 * copy also drops `generic-function`, which can run from `f<` over JSX to a
 * later `>(`. It isn't in `KEPT`, so its color was lexed again anyway.
 */
const TSX = Prism.languages.extend('tsx', {
  tag: { ...tagOf('tsx'), pattern: tagOf('jsx').pattern },
});
delete (TSX as Record<string, unknown>)['generic-function'];

/** tsx `code` recolored, and where its JSX is */
const recolorTsx = (code: string) =>
  recolor(Prism.tokenize(code, TSX), TS_KEYWORDS, code);

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
    : grammar === Prism.languages.tsx ? recolorTsx(code).tokens
    : recolor(Prism.tokenize(code, grammar), keywordsFor(grammar)).tokens,
} as typeof Prism;

/**
 * `code`'s JSX spans (./jsxColors/spans.ts), by the same reading that colors
 * them above
 */
export const jsxSpans = (code: string) => recolorTsx(code).spans;
