/**
 * Monaco's TypeScript tokenizer (its Monarch grammar), without Monaco, so
 * the code the server renders shows the colors Monaco shows once it takes
 * over (see ./theme.ts). Monaco runs this grammar for `ts` and `tsx` alike:
 * it has no JSX rules, so JSX gets the same tokens here as there.
 *
 * `language` is a copy of `language` in
 * monaco-editor/esm/vs/languages/definitions/typescript/typescript.js
 * (0.57.0), and `tokenize` runs it the way Monaco's Monarch lexer does
 * (esm/vs/editor/standalone/common/monarch/). After a Monaco upgrade, diff
 * that file against this copy.
 */
import type { Prism } from 'prism-react-renderer';

import { tokenClass } from './theme';

type GroupAction = string | { token: string; next?: string };
type Action =
  | string
  | { token: string; next?: string }
  | { cases: Record<string, string> }
  | GroupAction[];
type Rule = [RegExp, Action] | [RegExp, Action, string] | { include: string };

/* eslint-disable no-useless-escape -- copied verbatim, to diff against Monaco's */
const language = {
  tokenPostfix: '.ts',
  keywords: [
    'abstract',
    'any',
    'as',
    'asserts',
    'bigint',
    'boolean',
    'break',
    'case',
    'catch',
    'class',
    'continue',
    'const',
    'constructor',
    'debugger',
    'declare',
    'default',
    'delete',
    'do',
    'else',
    'enum',
    'export',
    'extends',
    'false',
    'finally',
    'for',
    'from',
    'function',
    'get',
    'if',
    'implements',
    'import',
    'in',
    'infer',
    'instanceof',
    'interface',
    'is',
    'keyof',
    'let',
    'module',
    'namespace',
    'never',
    'new',
    'null',
    'number',
    'object',
    'out',
    'package',
    'private',
    'protected',
    'public',
    'override',
    'readonly',
    'require',
    'global',
    'return',
    'satisfies',
    'set',
    'static',
    'string',
    'super',
    'switch',
    'symbol',
    'this',
    'throw',
    'true',
    'try',
    'type',
    'typeof',
    'undefined',
    'unique',
    'unknown',
    'var',
    'void',
    'while',
    'with',
    'yield',
    'async',
    'await',
    'of',
  ],
  operators: [
    '<=',
    '>=',
    '==',
    '!=',
    '===',
    '!==',
    '=>',
    '+',
    '-',
    '**',
    '*',
    '/',
    '%',
    '++',
    '--',
    '<<',
    '</',
    '>>',
    '>>>',
    '&',
    '|',
    '^',
    '!',
    '~',
    '&&',
    '||',
    '??',
    '?',
    ':',
    '=',
    '+=',
    '-=',
    '*=',
    '**=',
    '/=',
    '%=',
    '<<=',
    '>>=',
    '>>>=',
    '&=',
    '|=',
    '^=',
    '@',
  ],
  symbols: /[=><!~?:&|+\-*\/\^%]+/,
  escapes:
    /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
  digits: /\d+(_+\d+)*/,
  octaldigits: /[0-7]+(_+[0-7]+)*/,
  binarydigits: /[0-1]+(_+[0-1]+)*/,
  hexdigits: /[[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,
  regexpctl: /[(){}\[\]\$\^|\-*+?\.]/,
  regexpesc:
    /\\(?:[bBdDfnrstvwWn0\\\/]|@regexpctl|c[A-Z]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/,
  tokenizer: {
    root: [[/[{}]/, 'delimiter.bracket'], { include: 'common' }],
    common: [
      [
        /#?[a-z_$][\w$]*/,
        { cases: { '@keywords': 'keyword', '@default': 'identifier' } },
      ],
      [/[A-Z][\w\$]*/, 'type.identifier'],
      { include: '@whitespace' },
      [
        /\/(?=([^\\\/]|\\.)+\/([dgimsuy]*)(\s*)(\.|;|,|\)|\]|\}|$))/,
        { token: 'regexp', next: '@regexp' },
      ],
      [/[()\[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [/!(?=([^=]|$))/, 'delimiter'],
      [/@symbols/, { cases: { '@operators': 'delimiter', '@default': '' } }],
      [/(@digits)[eE]([\-+]?(@digits))?/, 'number.float'],
      [/(@digits)\.(@digits)([eE][\-+]?(@digits))?/, 'number.float'],
      [/0[xX](@hexdigits)n?/, 'number.hex'],
      [/0[oO]?(@octaldigits)n?/, 'number.octal'],
      [/0[bB](@binarydigits)n?/, 'number.binary'],
      [/(@digits)n?/, 'number'],
      [/[;,.]/, 'delimiter'],
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/'([^'\\]|\\.)*$/, 'string.invalid'],
      [/"/, 'string', '@string_double'],
      [/'/, 'string', '@string_single'],
      [/`/, 'string', '@string_backtick'],
    ],
    whitespace: [
      [/[ \t\r\n]+/, ''],
      [/\/\*\*(?!\/)/, 'comment.doc', '@jsdoc'],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
    ],
    comment: [
      [/[^\/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[\/*]/, 'comment'],
    ],
    jsdoc: [
      [/[^\/*]+/, 'comment.doc'],
      [/\*\//, 'comment.doc', '@pop'],
      [/[\/*]/, 'comment.doc'],
    ],
    regexp: [
      [
        /(\{)(\d+(?:,\d*)?)(\})/,
        [
          'regexp.escape.control',
          'regexp.escape.control',
          'regexp.escape.control',
        ],
      ],
      [
        /(\[)(\^?)(?=(?:[^\]\\\/]|\\.)+)/,
        [
          'regexp.escape.control',
          { token: 'regexp.escape.control', next: '@regexrange' },
        ],
      ],
      [/(\()(\?:|\?=|\?!)/, ['regexp.escape.control', 'regexp.escape.control']],
      [/[()]/, 'regexp.escape.control'],
      [/@regexpctl/, 'regexp.escape.control'],
      [/[^\\\/]/, 'regexp'],
      [/@regexpesc/, 'regexp.escape'],
      [/\\\./, 'regexp.invalid'],
      [
        /(\/)([dgimsuy]*)/,
        [{ token: 'regexp', next: '@pop' }, 'keyword.other'],
      ],
    ],
    regexrange: [
      [/-/, 'regexp.escape.control'],
      [/\^/, 'regexp.invalid'],
      [/@regexpesc/, 'regexp.escape'],
      [/[^\]]/, 'regexp'],
      [/\]/, { token: 'regexp.escape.control', next: '@pop' }],
    ],
    string_double: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop'],
    ],
    string_single: [
      [/[^\\']+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/'/, 'string', '@pop'],
    ],
    string_backtick: [
      [/\$\{/, { token: 'delimiter.bracket', next: '@bracketCounting' }],
      [/[^\\`$]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/`/, 'string', '@pop'],
    ],
    bracketCounting: [
      [/\{/, 'delimiter.bracket', '@bracketCounting'],
      [/\}/, 'delimiter.bracket', '@pop'],
      { include: 'common' },
    ],
  } satisfies Record<string, Rule[]>,
};
/* eslint-enable no-useless-escape */

type State = keyof typeof language.tokenizer;

/** Monarch's default brackets: what `@brackets` names each one */
const BRACKETS: Record<string, string> = {
  '{': 'delimiter.curly',
  '}': 'delimiter.curly',
  '[': 'delimiter.square',
  ']': 'delimiter.square',
  '(': 'delimiter.parenthesis',
  ')': 'delimiter.parenthesis',
  '<': 'delimiter.angle',
  '>': 'delimiter.angle',
};

interface CompiledRule {
  regex: RegExp;
  action: Action;
  next?: string;
}

/** Expands `@attr` like Monarch's compileRegExp, anchored at the position */
function compileRegExp(source: string): RegExp {
  for (let depth = 0; depth < 5 && source.includes('@'); depth++) {
    source = source.replace(/@(\w+)/g, (_, attr: string) => {
      const value = language[attr as keyof typeof language];
      return `(?:${(value as RegExp).source})`;
    });
  }
  return new RegExp(`^(?:${source})`);
}

/** Rules per state, with `include`s flattened */
const rules = {} as Record<State, CompiledRule[]>;
function compileState(state: State): CompiledRule[] {
  return language.tokenizer[state].flatMap((rule: Rule): CompiledRule[] => {
    if (!Array.isArray(rule)) {
      return compileState(rule.include.replace(/^@/, '') as State);
    }
    const [regex, action, next] = rule;
    return [{ regex: compileRegExp(regex.source), action, next }];
  });
}
for (const state of Object.keys(language.tokenizer) as State[]) {
  rules[state] = compileState(state);
}

/** A Prism-style token: plain text, or text with a type (a theme.ts class) */
export type Token = string | { type: string; content: string };

/**
 * Adds `text` to `tokens`, joined to the last token when it has the same
 * type: fewer spans, and no empty one where a line ends in plain text
 */
function pushToken(tokens: Token[], text: string, type: string | null) {
  if (!text) return;
  const last = tokens[tokens.length - 1];
  if (type === null) {
    if (typeof last === 'string') tokens[tokens.length - 1] = last + text;
    else tokens.push(text);
  } else if (typeof last === 'object' && last.type === type) {
    last.content += text;
  } else tokens.push({ type, content: text });
}

/**
 * Splits `code` into tokens as Monaco does, typed by the theme rule that
 * colors each (see tokenClass)
 */
export function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  const stack: State[] = ['root'];
  const emit = (text: string, monacoToken: string) =>
    pushToken(tokens, text, tokenClass(monacoToken));
  const fullToken = (token: string) =>
    token ? token + language.tokenPostfix : '';
  const move = (next: string | undefined) => {
    if (!next) return;
    if (next === '@pop') {
      if (stack.length > 1) stack.pop();
    } else stack.push(next.replace(/^@/, '') as State);
  };

  code.split('\n').forEach((line, lineIndex) => {
    if (lineIndex) pushToken(tokens, '\n', null);
    let pos = 0;
    while (pos < line.length) {
      const rest = line.slice(pos);
      let rule: CompiledRule | undefined;
      let match: RegExpMatchArray | null = null;
      for (rule of rules[stack[stack.length - 1]]) {
        match = rest.match(rule.regex);
        if (match) break;
      }
      // no rule matched (or one matched nothing): Monarch's defaultToken
      if (!rule || !match?.[0]) {
        emit(line[pos], fullToken('invalid'));
        pos += 1;
        continue;
      }
      const matched = match[0];
      const { action } = rule;
      if (Array.isArray(action)) {
        // one action per capture group, which cover the match
        action.forEach((group, i) => {
          const text = match[i + 1] ?? '';
          if (typeof group === 'string') emit(text, fullToken(group));
          else {
            emit(text, fullToken(group.token));
            move(group.next);
          }
        });
      } else if (typeof action === 'string') {
        emit(
          matched,
          action === '@brackets' ? BRACKETS[matched] : fullToken(action),
        );
        move(rule.next);
      } else if ('cases' in action) {
        const list = Object.keys(action.cases).find(
          key =>
            key !== '@default' &&
            (
              language[key.slice(1) as 'keywords' | 'operators'] as string[]
            ).includes(matched),
        );
        emit(matched, fullToken(action.cases[list ?? '@default']));
      } else {
        emit(matched, fullToken(action.token));
        move(action.next);
      }
      pos += matched.length;
    }
  });
  return tokens;
}

/**
 * Monaco's JSON tokens (monaco-editor/esm/vs/languages/features/json/
 * tokenization.js, over jsonc-parser's scanner): a string is a key unless it
 * follows a colon or sits in an array.
 */
export function tokenizeJson(code: string): Token[] {
  const tokens: Token[] = [];
  const parents: ('object' | 'array')[] = [];
  let lastWasColon = false;
  const scanner =
    /(\n)|([ \t\r]+)|(\/\/.*)|(\/\*[\s\S]*?(?:\*\/|$))|("(?:[^"\\\n]|\\.)*"?)|(-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)|([A-Za-z0-9_$]+)|([{}[\]:,])|([\s\S])/g;
  for (const [
    text,
    newline,
    space,
    line,
    block,
    string,
    number,
    word,
    punctuation,
  ] of code.matchAll(scanner)) {
    let token = '';
    if (newline || space) {
      pushToken(tokens, text, null);
      continue;
    } else if (line) token = 'comment.line.json';
    else if (block) token = 'comment.block.json';
    else if (string) {
      token =
        lastWasColon || parents[parents.length - 1] === 'array' ?
          'string.value.json'
        : 'string.key.json';
      lastWasColon = false;
    } else if (number) {
      token = 'number.json';
      lastWasColon = false;
    } else if (['true', 'false', 'null'].includes(word)) {
      token = 'keyword.json';
      lastWasColon = false;
    } else if (punctuation) {
      lastWasColon = punctuation === ':';
      if (punctuation === '{' || punctuation === '[') {
        parents.push(punctuation === '{' ? 'object' : 'array');
      } else if (punctuation === '}' || punctuation === ']') parents.pop();
      token = {
        '{': 'delimiter.bracket.json',
        '}': 'delimiter.bracket.json',
        '[': 'delimiter.array.json',
        ']': 'delimiter.array.json',
        ':': 'delimiter.colon.json',
        ',': 'delimiter.comma.json',
      }[punctuation] as string;
    }
    pushToken(tokens, text, tokenClass(token));
  }
  return tokens;
}

const tokenizers: Record<string, (code: string) => Token[]> = {
  ts: tokenize,
  tsx: tokenize,
  typescript: tokenize,
  json: tokenizeJson,
};

/**
 * A stand-in for Prism that prism-react-renderer (and react-live's editor)
 * accept as `prism`, tokenizing the languages Monaco highlights as Monaco
 * does
 */
export const monacoPrism = {
  languages: tokenizers,
  tokenize: (code: string, grammar: (code: string) => Token[]) => grammar(code),
  hooks: {
    run() {
      // no Prism plugins to run
    },
  },
} as unknown as typeof Prism;

/** Whether `monacoPrism` tokenizes `language` */
export function isMonacoTokenized(language: string) {
  return Object.prototype.hasOwnProperty.call(
    tokenizers,
    language.toLowerCase(),
  );
}
