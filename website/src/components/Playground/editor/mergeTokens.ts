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
 * join, whitespace joins the token before it when neither style shows on a
 * space (only color, fontStyle or fontWeight), and text in the plain color
 * becomes a `plain` token (render it as bare text: `isPlainToken`).
 *
 * Highlighting costs an element per token, and most of Prism's tokens are
 * whitespace or plain, so this halves the elements a page's code adds.
 *
 * @param plain the `plain` style of getTokenProps's theme, which the `<pre>`
 *   draws
 */
export function mergeTokens(
  line: readonly Token[],
  getTokenProps: GetTokenProps,
  plain: CSSProperties | undefined,
): Token[] {
  // an empty line's placeholder keeps its own style (inline-block)
  if (line.some(token => token.empty)) return [...line];
  const merged: Token[] = [];
  let lastLook = '';
  // whether a space joined to the last token looks like any other space
  let lastUnseenOnSpace = true;
  for (const token of line) {
    const { look, unseenOnSpace } = appearance(token, getTokenProps, plain);
    const last = merged[merged.length - 1];
    const blank = unseenOnSpace && !token.content.trim();
    if (last && ((blank && lastUnseenOnSpace) || look === lastLook)) {
      merged[merged.length - 1] = {
        ...last,
        content: last.content + token.content,
      };
      continue;
    }
    lastLook = blank ? '' : look;
    lastUnseenOnSpace = unseenOnSpace;
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

type GetTokenProps = (input: TokenInputProps) => TokenOutputProps;
interface Appearance {
  /** What a token draws beyond the plain style ('' for plain text) */
  look: string;
  /** Whether a space in its style looks like any other space */
  unseenOnSpace: boolean;
}

// A token's style depends only on its types and getTokenProps (plain comes
// from the same theme), so compare each types once per getTokenProps (one
// per Highlight render).
const appearances = new WeakMap<GetTokenProps, Map<string, Appearance>>();

function appearance(
  token: Token,
  getTokenProps: GetTokenProps,
  plain: CSSProperties | undefined,
): Appearance {
  let byTypes = appearances.get(getTokenProps);
  if (!byTypes) appearances.set(getTokenProps, (byTypes = new Map()));
  const typesKey = token.types.join(' ');
  let found = byTypes.get(typesKey);
  if (!found) {
    found = compareStyle(getTokenProps({ token }).style, plain);
    byTypes.set(typesKey, found);
  }
  return found;
}

function compareStyle(
  style: CSSProperties | undefined,
  plain: CSSProperties | undefined,
): Appearance {
  const drawn = Object.entries(style ?? {}).filter(
    ([key, value]) =>
      value != null && plain?.[key as keyof CSSProperties] !== value,
  );
  return {
    look: drawn
      .map(([key, value]) => `${key}:${value}`)
      .sort()
      .join(';'),
    unseenOnSpace: drawn.every(([key]) => UNSEEN_ON_SPACE.has(key)),
  };
}
