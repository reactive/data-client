import { UNDEF } from '../denormalize/UNDEF.js';

/** Function path used by `argsKey` deps. Distinguished from object paths
 * via `typeof === 'function'`. */
export type KeyFn = (args: readonly any[]) => string | undefined;

/** Sentinel string used in place of `undefined` for string-keyed deps so we
 * can perform Map lookups consistently. */
const UNDEF_KEY = '\0';

const valueKeys = new Map<unknown, object>();

/** `WeakMap` key for an entity value: the object itself, `UNDEF` for
 * `undefined`, or a stable stand-in for any other value (`null`, `INVALID`). */
function depKey(entity: unknown): object {
  if (typeof entity === 'object' && entity !== null) return entity;
  if (entity === undefined) return UNDEF;
  let key = valueKeys.get(entity);
  if (!key) {
    key = {};
    valueKeys.set(entity, key);
  }
  return key;
}

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
  /** Sticky: true once any function-typed (`argsKey`) dep has been stored.
   * Lets `get` pick the entity-only fast path when no schema in this map
   * uses `argsKey` — avoids a polymorphic `typeof` branch per walk step. */
  private hasStr = false;

  get(
    entity: K,
    getDependency: GetDependency<Path, K | symbol>,
    args: readonly any[] = [],
  ) {
    let curLink = this.next.get(depKey(entity) as K);
    if (!curLink) return EMPTY;
    if (this.hasStr) return this._getMixed(curLink, getDependency, args);
    while (curLink.nextPath) {
      // WeakMap keys must be objects, so other values use a stand-in
      const nextDependency = depKey(getDependency(curLink.nextPath as Path));
      const nextLink = curLink.next.get(nextDependency as any);
      if (!nextLink) return EMPTY;
      curLink = nextLink;
    }
    // curLink exists, but has no path - so must have a value
    return [curLink.value, curLink.journey] as readonly [V, Path[]];
  }

  /** Slow path: dep chain may interleave entity and `argsKey`-style deps. */
  private _getMixed(
    curLink: Link<Path, K, V>,
    getDependency: GetDependency<Path, K | symbol>,
    args: readonly any[],
  ) {
    while (curLink.nextPath) {
      let nextLink: Link<Path, K, V> | undefined;
      if (typeof curLink.nextPath === 'function') {
        const keyValue = (curLink.nextPath as KeyFn)(args) ?? UNDEF_KEY;
        nextLink = curLink.nextStr?.get(keyValue);
      } else {
        const nextDependency = depKey(getDependency(curLink.nextPath as Path));
        nextLink = curLink.next.get(nextDependency as any);
      }
      if (!nextLink) return EMPTY;
      curLink = nextLink;
    }
    return [curLink.value, curLink.journey] as readonly [V, Path[]];
  }

  set(
    dependencies: Dep<Path, K>[],
    value: V,
    args: readonly any[] = [],
    /** Optional consumer-facing journey returned to `get()` callers verbatim.
     * Defaults to `dependencies.map(d => d.path)`. Pass an explicit array to
     * skip the per-write `.map(...)` and (more importantly) to skip per-hit
     * post-processing — see `GlobalCache.getResults` for the read-side
     * payoff. The array becomes a shared reference held by every subsequent
     * cache hit; callers MUST NOT mutate it. */
    journey?: Path[],
  ) {
    if (dependencies.length < 1) throw new KeySize();
    let curLink: Link<Path, K, V> = this as any;
    for (const dep of dependencies) {
      let nextLink: Link<Path, K, V> | undefined;
      if (typeof dep.path === 'function') {
        this.hasStr = true;
        if (!curLink.nextStr) curLink.nextStr = new Map();
        const k = (dep.path as KeyFn)(args) ?? UNDEF_KEY;
        nextLink = curLink.nextStr.get(k);
        if (!nextLink) {
          nextLink = new Link<Path, K, V>();
          curLink.nextStr.set(k, nextLink);
        }
      } else {
        const key = depKey(dep.entity) as K;
        nextLink = curLink.next.get(key);
        if (!nextLink) {
          nextLink = new Link<Path, K, V>();
          curLink.next.set(key, nextLink);
        }
      }
      curLink.nextPath = dep.path as any;
      curLink = nextLink;
    }
    // in case there used to be more
    curLink.nextPath = undefined;
    curLink.value = value;
    // we could recompute this on get, but it would have a cost and we optimize for `get`
    curLink.journey = journey ?? (dependencies.map(d => d.path) as Path[]);
  }

  /** True once any `argsKey`-style dep has been written. Consumers can use
   * this to skip function-stripping work on the hit path when false. */
  get hasStringDeps(): boolean {
    return this.hasStr;
  }
}

export type GetDependency<Path, K = object | symbol> = (
  lookup: Path,
) => K | undefined;

export interface Dep<Path, K = object> {
  path: Path | KeyFn;
  entity: K | undefined;
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
