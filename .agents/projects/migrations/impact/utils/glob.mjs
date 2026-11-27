/** Matches a relative path against a glob with **, *, ? and {a,b}. (path.matchesGlob is experimental in Node 22.) */
export function matchesGlob(rel, glob) {
  const re = glob
    .replace(/[.+^$()|[\]\\]/g, '\\$&')
    .replace(/\{([^}]+)\}/g, (_, alts) => `(${alts.split(',').join('|')})`)
    .replace(/\*\*\//g, '\u0000')
    .replace(/\*\*/g, '\u0001')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/\u0000/g, '(.*/)?')
    .replace(/\u0001/g, '.*');
  return new RegExp(`^${re}$`).test(rel);
}
