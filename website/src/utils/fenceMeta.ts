/** Reading code fence metastrings, like `title="Page" collapsed` */

/** `key="value"`, `key='value'` or bare `key=value` from a fence metastring */
export function metaValue(metastring: string, key: string): string | undefined {
  return new RegExp(`\\b${key}=(?:(["'])(.*?)\\1|([^\\s"']+))`)
    .exec(metastring)
    ?.slice(2)
    .find(value => value !== undefined);
}

/** A bare `key` flag in a fence metastring, not the word inside another
 * key's value like `title="Page layout"` or `path=src/layout.tsx` */
export function metaFlag(metastring: string, key: string): boolean {
  return new RegExp(`(?:^|\\s)${key}(?=\\s|$)`).test(
    metastring.replace(/\w+=(?:(["']).*?\1|\S+)/g, ''),
  );
}
