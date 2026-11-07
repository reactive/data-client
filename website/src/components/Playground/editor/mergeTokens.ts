import type {
  Token,
  TokenInputProps,
  TokenOutputProps,
} from 'prism-react-renderer';
import type { CSSProperties } from 'react';

/** Styles a space draws the same in monospace code whatever their value */
const UNSEEN_ON_SPACE = new Set(['color', 'fontStyle', 'fontWeight']);

/**
 * A line's tokens, as few as draw the same code: neighbours that look alike
 * join, whitespace joins the token before it, and text in the plain color
 * becomes a `plain` token (render it as bare text: `isPlainToken`).
 *
 * Highlighting costs an element per token, and most of Prism's tokens are
 * whitespace or plain, so this halves the elements a page's code adds.
 *
 * @param plain the theme's `plain` style, which the `<pre>` draws
 */
export function mergeTokens(
  line: readonly Token[],
  getTokenProps: (input: TokenInputProps) => TokenOutputProps,
  plain: CSSProperties | undefined,
): Token[] {
  const merged: Token[] = [];
  let lastLook = '';
  for (const token of line) {
    // an empty line's placeholder keeps its own style (inline-block)
    if (token.empty) return [...line];
    const style = getTokenProps({ token }).style;
    const look = lookOf(style, plain);
    const last = merged[merged.length - 1];
    const blank = !token.content.trim() && unseenOnSpace(style, plain);
    if (last && (blank || look === lastLook)) {
      merged[merged.length - 1] = {
        ...last,
        content: last.content + token.content,
      };
      continue;
    }
    lastLook = blank ? '' : look;
    merged.push({
      types: lastLook ? token.types : ['plain'],
      content: token.content,
    });
  }
  return merged;
}

/** A token `mergeTokens` made plain: the `<pre>` already draws it */
export function isPlainToken(token: Token) {
  return !token.empty && token.types.length === 1 && token.types[0] === 'plain';
}

/** What a token draws beyond the plain style ('' for plain text) */
function lookOf(style: CSSProperties | undefined, plain?: CSSProperties) {
  return differences(style, plain)
    .map(([key, value]) => `${key}:${value}`)
    .sort()
    .join(';');
}

function unseenOnSpace(
  style: CSSProperties | undefined,
  plain?: CSSProperties,
) {
  return differences(style, plain).every(([key]) => UNSEEN_ON_SPACE.has(key));
}

function differences(style: CSSProperties | undefined, plain?: CSSProperties) {
  if (!style) return [];
  return Object.entries(style).filter(
    ([key, value]) =>
      value != null && plain?.[key as keyof CSSProperties] !== value,
  );
}
