// Shared by the Store inspector and the Fixtures panel (eager), so rows in
// both name an endpoint the same way

const splitCache = new Map<string, { method: string; path: string }>();
/** `GET https://host/posts?x=1` → method and path (host dropped) */
export function splitKey(key: string) {
  let split = splitCache.get(key);
  if (!split) splitCache.set(key, (split = parseKey(key)));
  return split;
}
function parseKey(key: string) {
  const match = /^([A-Z]+) (\S+)(.*)$/.exec(key);
  if (!match) return { method: '', path: key };
  const [, method, url, rest] = match;
  try {
    const parsed = new URL(url);
    return { method, path: `${parsed.pathname}${parsed.search}${rest}` };
  } catch {
    return { method, path: `${url}${rest}` };
  }
}
