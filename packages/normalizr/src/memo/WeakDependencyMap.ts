import { UNDEF } from '../denormalize/UNDEF.js';

/** Function path used by `argsKey` deps. Distinguished from object paths
 * via `typeof === 'function'`. */
export type KeyFn = (args: readonly any[]) => string | undefined;

/** Sentinel string used in place of `undefined` for string-keyed deps so we
 * can perform Map lookups consistently. */
const UNDEF_KEY = '\0';

/** Maps a (ordered) list of dependencies to a value.
 *
 * Useful as a memoization cache for flat/normalized stores.
 *
 * Object dependencies are weakly referenced (via `WeakMap`), allowing
 * automatic garbage collection when the dependency is no longer used.
 * String-keyed dependencies (used by `argsKey`) sit on a `Map` keyed by the
 * value returned from `path(args)`, branching on a stable function reference.
 */
export default class WeakDependencyMap<
  Path,
  K extends object = object,
  V = any,
> {
  private readonly next = new WeakMap<K, Link<Path, K, V>>();
  private nextPath: Path | KeyFn | undefined = undefined;

  get(
    entity: K,
    getDependency: GetDependency<Path, K | symbol>,
    args: readonly any[] = [],
  ) {
    let curLink = this.next.get(entity);
    if (!curLink) return EMPTY;
    while (curLink.nextPath) {
      let nextLink: Link<Path, K, V> | undefined;
      if (typeof curLink.nextPath === 'function') {
        const keyValue = (curLink.nextPath as KeyFn)(args) ?? UNDEF_KEY;
        nextLink = curLink.nextStr?.get(keyValue);
      } else {
        // we cannot perform lookups with `undefined`, so we use a special object to represent undefined
        const nextDependency = getDependency(curLink.nextPath as Path) ?? UNDEF;
        nextLink = curLink.next.get(nextDependency as any);
      }
      if (!nextLink) return EMPTY;
      curLink = nextLink;
    }
    // curLink exists, but has no path - so must have a value
    return [curLink.value, curLink.journey] as readonly [V, Path[]];
  }

  set(dependencies: Dep<Path, K>[], value: V) {
    if (dependencies.length < 1) throw new KeySize();
    let curLink: Link<Path, K, V> = this as any;
    for (const dep of dependencies) {
      let nextLink: Link<Path, K, V> | undefined;
      if (typeof dep.path === 'function') {
        if (!curLink.nextStr) curLink.nextStr = new Map();
        const k = dep.key ?? UNDEF_KEY;
        nextLink = curLink.nextStr.get(k);
        if (!nextLink) {
          nextLink = new Link<Path, K, V>();
          curLink.nextStr.set(k, nextLink);
        }
      } else {
        nextLink = curLink.next.get(dep.entity as K);
        if (!nextLink) {
          nextLink = new Link<Path, K, V>();
          // void members are represented as a symbol so we can lookup
          curLink.next.set((dep.entity ?? UNDEF) as K, nextLink);
        }
      }
      curLink.nextPath = dep.path as any;
      curLink = nextLink;
    }
    // in case there used to be more
    curLink.nextPath = undefined;
    curLink.value = value;
    // we could recompute this on get, but it would have a cost and we optimize for `get`
    curLink.journey = dependencies.map(d => d.path) as Path[];
  }
}

export type GetDependency<Path, K = object | symbol> = (
  lookup: Path,
) => K | undefined;

export interface Dep<Path, K = object> {
  path: Path | KeyFn;
  entity?: K | undefined;
  /** Set when `path` is a `KeyFn`; the precomputed `path(args)` value. */
  key?: string | undefined;
}

const EMPTY = [undefined, undefined] as const;

/** Link in a chain */
class Link<Path, K extends object, V> {
  next = new WeakMap<K, Link<Path, K, V>>();
  /** Lazily allocated branch for string-keyed (`argsKey`) deps. */
  nextStr: Map<string, Link<Path, K, V>> | undefined = undefined;
  nextPath: Path | KeyFn | undefined = undefined;
  value: V | undefined = undefined;
  journey: Path[] = [];
}

class KeySize extends Error {
  message = 'Keys must include at least one member';
}
