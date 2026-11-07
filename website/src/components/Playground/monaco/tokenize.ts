/**
 * Monaco's tokens without Monaco, so the code the server renders shows the
 * colors Monaco shows once it takes over (see ./theme.ts). `runGrammar` runs
 * the Monarch grammars in ./grammars.ts the way Monaco's Monarch lexer does
 * (monaco-editor/esm/vs/editor/standalone/common/monarch/), for the parts of
 * Monarch they use; `tokenizeJson` follows Monaco's JSON tokens.
 */
import type { Prism } from 'prism-react-renderer';

import * as grammars from './grammars';
import { tokenClass } from './theme';

/** A Prism-style token: plain text, or text with a type (a theme.ts class) */
export type Token = string | { type: string; content: string };

interface ActionObject {
  token: string;
  next?: string;
  switchTo?: string;
  nextEmbedded?: string;
}
type Action =
  | string
  | ActionObject
  | { cases: Record<string, string> }
  | (string | ActionObject)[];
type Rule = [RegExp, Action?, string?] | { include: string };
interface Grammar {
  defaultToken: string;
  tokenPostfix: string;
  ignoreCase?: boolean;
  tokenizer: Record<string, Rule[]>;
}

// ./grammars.ts copies Monaco's untyped definitions
const { typescript, javascript, html } = grammars as unknown as Record<
  'typescript' | 'javascript' | 'html',
  Grammar
>;

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
  /** matches at the start of the text */
  regex: RegExp;
  /** matches anywhere in the text */
  search: RegExp;
  action: Action;
}

const compiled = new Map<Grammar, Record<string, CompiledRule[]>>();

/**
 * A grammar's rules per state, `include`s flattened and `@attr`s expanded,
 * compiled once per grammar
 */
function compile(grammar: Grammar): Record<string, CompiledRule[]> {
  let rules = compiled.get(grammar);
  if (!rules) {
    rules = compileRules(grammar);
    compiled.set(grammar, rules);
  }
  return rules;
}

function compileRules(grammar: Grammar): Record<string, CompiledRule[]> {
  const attrs = grammar as unknown as Record<string, unknown>;
  const flags = grammar.ignoreCase ? 'i' : '';
  const expand = (source: string) => {
    for (let depth = 0; depth < 5 && source.includes('@'); depth++) {
      source = source.replace(
        /@(\w+)/g,
        (_, attr: string) => `(?:${(attrs[attr] as RegExp).source})`,
      );
    }
    return source;
  };
  const compileState = (state: string): CompiledRule[] =>
    grammar.tokenizer[state].flatMap(rule => {
      if (!Array.isArray(rule)) {
        return compileState(rule.include.replace(/^@/, ''));
      }
      const [regex, action = '', next] = rule;
      const source = expand(regex.source);
      return [
        {
          regex: new RegExp(`^(?:${source})`, flags),
          search: new RegExp(source, flags),
          action:
            next === undefined ? action
            : typeof action === 'string' ? { token: action, next }
            : { ...(action as ActionObject), next },
        },
      ];
    });
  return Object.fromEntries(
    Object.keys(grammar.tokenizer).map(state => [state, compileState(state)]),
  );
}

/** Tokenizes one line at a time, keeping its state between lines */
type LineTokenizer = (
  line: string,
  emit: (text: string, monacoToken: string) => void,
) => void;

/**
 * Monaco's languages by the MIME type a `<script>` names. `<style>` (CSS)
 * stays plain: no playground file has one
 */
const EMBEDDED: Record<string, Grammar> = {
  'text/javascript': javascript,
};

/**
 * Runs `grammar` as Monaco's Monarch lexer does: at each position the first
 * rule of the current state that matches decides the token and the next
 * state; with none, one character gets `defaultToken`. Inside an embedded
 * language, that language's grammar gets each line up to where a rule
 * (`nextEmbedded: '@pop'`) would leave it.
 */
function runGrammar(grammar: Grammar): LineTokenizer {
  const rules = compile(grammar);
  const stack = ['root'];
  /** the embedded language's tokenizer while in one; null for one we lack */
  let embedded: LineTokenizer | null | undefined;
  const state = () => stack[stack.length - 1];
  // `scriptEmbedded.text/javascript` falls back to `scriptEmbedded`'s rules
  const rulesOf = (name: string): CompiledRule[] =>
    rules[name] ?? rulesOf(name.slice(0, name.lastIndexOf('.')));
  /**
   * Monarch's substituteMatches: `$1` for a group, `$S2` for a state part,
   * each lowercased in a grammar that ignores case
   */
  const substitute = (s: string, match: RegExpMatchArray) => {
    const parts = [state(), ...state().split('.')];
    return s.replace(/\$(\d)|\$[sS](\d)/g, (_, group, part) => {
      const value =
        group !== undefined ? (match[+group] ?? '') : (parts[+part] ?? '');
      return grammar.ignoreCase ? value.toLowerCase() : value;
    });
  };
  const fullToken = (token: string) =>
    token ? token + grammar.tokenPostfix : '';

  const tokenizeLine: LineTokenizer = (line, emit) => {
    let pos = 0;
    if (embedded !== undefined) {
      const leaves = rulesOf(state())
        .filter(rule => (rule.action as ActionObject).nextEmbedded === '@pop')
        .map(rule => line.search(rule.search))
        .filter(found => found !== -1);
      pos = leaves.length ? Math.min(...leaves) : line.length;
      if (embedded) embedded(line.slice(0, pos), emit);
      else emit(line.slice(0, pos), '');
    }
    while (pos < line.length) {
      const rest = line.slice(pos);
      let rule: CompiledRule | undefined;
      let match: RegExpMatchArray | null = null;
      for (rule of rulesOf(state())) {
        match = rest.match(rule.regex);
        if (match) break;
      }
      if (!rule || !match?.[0]) {
        emit(line[pos], fullToken(grammar.defaultToken));
        pos += 1;
        continue;
      }
      const groups = match;
      const apply = (action: string | ActionObject, text: string) => {
        if (typeof action === 'string') {
          emit(
            text,
            action === '@brackets' ? BRACKETS[text] : fullToken(action),
          );
          return;
        }
        if (action.token !== '@rematch') emit(text, fullToken(action.token));
        const target = action.switchTo ?? action.next;
        if (target === '@pop') {
          if (stack.length > 1) stack.pop();
        } else if (target) {
          if (action.switchTo) stack.pop();
          stack.push(substitute(target, groups).replace(/^@/, ''));
        }
        if (action.nextEmbedded === '@pop') {
          embedded = undefined;
        } else if (action.nextEmbedded) {
          const mime = substitute(action.nextEmbedded, groups);
          embedded =
            Object.prototype.hasOwnProperty.call(EMBEDDED, mime) ?
              runGrammar(EMBEDDED[mime])
            : null;
        }
      };
      const { action } = rule;
      let consumed = match[0];
      if (Array.isArray(action)) {
        // one action per capture group, which together cover the match
        action.forEach((group, i) => apply(group, groups[i + 1] ?? ''));
      } else if (typeof action === 'object' && 'cases' in action) {
        const lists = grammar as unknown as Record<string, string[]>;
        const key = Object.keys(action.cases).find(
          key => key !== '@default' && lists[key.slice(1)].includes(consumed),
        );
        apply(action.cases[key ?? '@default'], consumed);
      } else {
        apply(action, consumed);
        // @rematch: the next state matches the same text again
        if (typeof action === 'object' && action.token === '@rematch') {
          consumed = '';
        }
      }
      pos += consumed.length;
      if (embedded !== undefined) {
        // entered an embedded language: it takes the rest of the line
        tokenizeLine(line.slice(pos), emit);
        return;
      }
    }
  };
  return tokenizeLine;
}

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

const DELIMITER = tokenClass('delimiter');

/**
 * Tokenizes `code` with `grammar`, typed by the theme rule that colors each
 * token (see tokenClass). Monaco's bracket pair colorization draws HTML's
 * `{}()` outside comments and strings in the delimiter color (theme.ts), so
 * they get it here too. (Embedded JavaScript makes them delimiters itself;
 * its other plain tokens, whitespace and symbols, hold no brackets.)
 */
function tokenizeWith(grammar: Grammar, code: string): Token[] {
  const tokens: Token[] = [];
  const tokenizeLine = runGrammar(grammar);
  code.split('\n').forEach((line, i) => {
    if (i) pushToken(tokens, '\n', null);
    tokenizeLine(line, (text, monacoToken) => {
      const type = tokenClass(monacoToken);
      if (
        grammar === html &&
        (monacoToken === '' || monacoToken.endsWith(grammar.tokenPostfix)) &&
        !/^(comment|string)/.test(monacoToken)
      ) {
        for (const part of text.split(/([{}()])/)) {
          pushToken(tokens, part, /^[{}()]$/.test(part) ? DELIMITER : type);
        }
      } else pushToken(tokens, text, type);
    });
  });
  return tokens;
}

const JSON_PUNCTUATION: Record<string, string> = {
  '{': 'delimiter.bracket.json',
  '}': 'delimiter.bracket.json',
  '[': 'delimiter.array.json',
  ']': 'delimiter.array.json',
  ':': 'delimiter.colon.json',
  ',': 'delimiter.comma.json',
};

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
    } else if (word === 'true' || word === 'false' || word === 'null') {
      token = 'keyword.json';
      lastWasColon = false;
    } else if (punctuation) {
      lastWasColon = punctuation === ':';
      if (punctuation === '{' || punctuation === '[') {
        parents.push(punctuation === '{' ? 'object' : 'array');
      } else if (punctuation === '}' || punctuation === ']') parents.pop();
      token = JSON_PUNCTUATION[punctuation];
    }
    pushToken(tokens, text, tokenClass(token));
  }
  return tokens;
}

export const tokenizeTs = (code: string) => tokenizeWith(typescript, code);
export const tokenizeHtml = (code: string) => tokenizeWith(html, code);

/** Tokenizers by fence language, as Monaco highlights each (./language.ts) */
const tokenizers: Record<string, (code: string) => Token[]> = {
  ts: tokenizeTs,
  tsx: tokenizeTs,
  typescript: tokenizeTs,
  html: tokenizeHtml,
  json: tokenizeJson,
};

/** Whether `monacoPrism` tokenizes fence language `language` as Monaco does */
export function isMonacoTokenized(language: string) {
  return Object.prototype.hasOwnProperty.call(
    tokenizers,
    language.toLowerCase(),
  );
}

/**
 * Stands in for Prism as react-live's `prism`: prism-react-renderer's
 * Highlight lowercases the language, reads `languages[language]` as the
 * grammar, and calls `tokenize(code, grammar)` between `hooks.run` calls.
 * Here the "grammar" is the tokenizer.
 */
export const monacoPrism = {
  languages: tokenizers,
  tokenize: (code: string, tokenizer: (code: string) => Token[]) =>
    tokenizer(code),
  hooks: {
    run() {
      // no Prism plugins to run
    },
  },
} as unknown as typeof Prism;
