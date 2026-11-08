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

import { isComponentName } from './language';

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

/**
 * Whether a tag Prism found at `at` in `code` (its `open` is `<` or `</`)
 * reads as type arguments, as `f<T>()` does: in code, right after a name
 */
const isTypeArguments = (
  code: string,
  at: number,
  open: string,
  inChildren: boolean,
) => !inChildren && open === '<' && /[\w$]/.test(code[at - 1] ?? '');

/**
 * Whether a tag is type parameters, as TypeScript decides in .tsx: `<T extends`
 * (maybe `<const T extends`) starts a generic arrow function, unless the next
 * token makes `extends` an attribute (`=`, `>` or `/`). JSX children have
 * none: there `<` always starts an element.
 */
function isTypeParameters(
  name: string,
  attributes: Token[],
  inChildren: boolean,
) {
  // only a plain name: `<a.B extends` and `<svg:a extends` are tags
  const isName = (text: string) => /^[A-Za-z_$][\w$]*$/.test(text);
  if (inChildren || !isName(name)) return false;
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

/** What a JSX span holds, in `jsxSpans()` */
export const JSX_TAG = 0;
export const JSX_ATTRIBUTE = 1;
export const JSX_TEXT = 2;

/** How `recolor` reads tsx `code`'s JSX */
interface JsxReading {
  code: string;
  /** Where each tag name, attribute name and text is: a start, length and kind */
  spans: number[];
}

/**
 * Prism's tokens with all but the `KEPT` ones lexed again as Monaco does.
 * With `jsx`, tag names, attribute names and text get the colors TypeScript
 * gives them.
 */
function recolor(stream: Token[], keywords: Set<string>, jsx?: JsxReading) {
  const { code, spans } = jsx ?? { code: '', spans: [] };
  const lexer = new MonacoLexer(keywords);
  /** Where JSX nests: an element's children, or code (`{}`, a tag's attributes) */
  const nesting: ('children' | 'code')[] = [];
  /** `<Name attr="value">` or `</Name>`, maybe without a name */
  const walkTag = (tag: Prism.Token) => {
    const [head, ...attributes] = contentOf(tag);
    // a name can come in parts: `svg:` (namespace) and `path`
    const [open, ...nameParts] = contentOf(head as Prism.Token);
    const name = textOf(nameParts);
    const inChildren = nesting.at(-1) === 'children';
    if (
      isTypeArguments(code, lexer.at, textOf(open), inChildren) ||
      isTypeParameters(name, attributes, inChildren)
    ) {
      // read again as TypeScript, so numbers in a constraint keep their color
      return walkAll(Prism.tokenize(textOf(tag), Prism.languages.typescript));
    }
    lexer.addCode(textOf(open));
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
    for (let i = 0; i < list.length; i++) {
      walk(list[i]);
    }
  };
  walkAll(stream);
  return lexer.result();
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

const tagOf = (language: 'jsx' | 'tsx') =>
  (Prism.languages[language] as unknown as { tag: { pattern: RegExp } }).tag;

/**
 * Prism's tsx grammar, but with jsx's tag pattern, which finds a tag right
 * after another's `>` (`<li><b>`) or after text (`by<b>`). tsx's needs a
 * character before the `<` that isn't a word's, so it misses those, and
 * `isTypeArguments` takes over that check where it holds: in code. Without
 * `generic-function`, which can run from `f<` over JSX to a later `>(`, and
 * whose color isn't kept anyway.
 */
const TSX = Prism.languages.extend('tsx', {
  tag: { ...tagOf('tsx'), pattern: tagOf('jsx').pattern, lookbehind: false },
});
delete (TSX as Record<string, unknown>)['generic-function'];

/** tsx `code` recolored, and where its JSX is */
function recolorTsx(code: string) {
  const jsx: JsxReading = { code, spans: [] };
  return {
    tokens: recolor(Prism.tokenize(code, TSX), TS_KEYWORDS, jsx),
    spans: jsx.spans,
  };
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
    : grammar === Prism.languages.tsx ? recolorTsx(code).tokens
    : recolor(Prism.tokenize(code, grammar), keywordsFor(grammar)),
} as typeof Prism;

/**
 * Where `code`'s JSX tag names, attribute names and text are, by the same
 * reading that colors them above: a start, length and kind (`JSX_TAG`…) each
 */
export const jsxSpans = (code: string) => recolorTsx(code).spans;
