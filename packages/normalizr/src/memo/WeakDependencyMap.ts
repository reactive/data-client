import { UNDEF } from '../denormalize/UNDEF.js';

/** Function path used by `argsKey` deps. Distinguished from object paths
 * via `typeof === 'function'`. */
export type KeyFn = (args: readonly any[]) => string | undefined;

/** Sentinel string used in place of `undefined` for string-keyed deps so
 * equal `argsKey` results compare equal. */
const UNDEF_KEY = '\0';

/** Maps a (ordered) list of dependencies to a value.
 *
 * Useful as a memoization cache for flat/normalized stores.
 *
 * Only the first dependency is a `WeakMap` key, so a cached value is
 * collected with it. The rest are stored on the entry and compared by
 * identity on `get`. Keeping one level of `WeakMap` matters: garbage
 * collectors resolve nested `WeakMap`s one level per marking pass, and
 * Hermes rescans every `WeakMap` entry in the heap on each pass, so a chain
 * as long as the dependency list stalls every old-generation collection.
 *
 * String-keyed dependencies (used by `argsKey`) split entries into buckets
 * by the value `path(args)` returns, so each bucket keeps its own value.
 */
export default class WeakDependencyMap<
  Path,
  K extends object = object,
  V = any,
> {
  private readonly next = new WeakMap<K, Entry<Path, V>[]>();
  /** Sticky: true once any function-typed (`argsKey`) dep has been stored. */
  private hasStr = false;

  get(
    entity: K,
    getDependency: GetDependency<Path, K | symbol>,
    args: readonly any[] = [],
  ) {
    const entries = this.next.get(entity);
    if (!entries) return EMPTY;
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (matches(entry, getDependency, args))
        return [entry.value, entry.journey] as readonly [V, Path[]];
    }
    return EMPTY;
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
    const paths = new Array<Path | KeyFn>(dependencies.length - 1);
    const keys = new Array<unknown>(dependencies.length - 1);
    let bucket = '';
    for (let i = 1; i < dependencies.length; i++) {
      const dep = dependencies[i];
      paths[i - 1] = dep.path;
      if (typeof dep.path === 'function') {
        this.hasStr = true;
        const k = (dep.path as KeyFn)(args) ?? UNDEF_KEY;
        keys[i - 1] = k;
        bucket += `${k}\u0001`;
      } else {
        keys[i - 1] = dep.entity ?? UNDEF;
      }
    }
    const root = (dependencies[0].entity ?? UNDEF) as K;
    const entry: Entry<Path, V> = {
      paths,
      keys,
      bucket,
      value,
      // we could recompute this on get, but it would have a cost and we optimize for `get`
      journey: journey ?? (dependencies.map(d => d.path) as Path[]),
    };
    const entries = this.next.get(root);
    if (!entries) {
      this.next.set(root, [entry]);
      return;
    }
    entries.unshift(entry);
    // Keep the newest few per bucket, so a store that flips back (an
    // optimistic update rolled back) still hits. Older ones only pin stale
    // entities.
    let kept = 0;
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].bucket !== bucket) continue;
      if (++kept > VARIANTS) entries.splice(i--, 1);
    }
  }

  /** True once any `argsKey`-style dep has been written. Consumers can use
   * this to skip function-stripping work on the hit path when false. */
  get hasStringDeps(): boolean {
    return this.hasStr;
  }
}

function matches<Path, K extends object, V>(
  entry: Entry<Path, V>,
  getDependency: GetDependency<Path, K | symbol>,
  args: readonly any[],
): boolean {
  const { paths, keys } = entry;
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    if (typeof path === 'function') {
      if (((path as KeyFn)(args) ?? UNDEF_KEY) !== keys[i]) return false;
    } else if ((getDependency(path as Path) ?? UNDEF) !== keys[i]) {
      return false;
    }
  }
  return true;
}

export type GetDependency<Path, K = object | symbol> = (
  lookup: Path,
) => K | undefined;

export interface Dep<Path, K = object> {
  path: Path | KeyFn;
  entity: K | undefined;
}

const EMPTY = [undefined, undefined] as const;

/** Entries kept per (first dependency, `argsKey` bucket). */
const VARIANTS = 2;

/** One cached value: the dependencies after the first, and what they resolved to. */
interface Entry<Path, V> {
  readonly paths: (Path | KeyFn)[];
  /** Entity reference (or `UNDEF`) for entity paths; `argsKey` result for function paths. */
  readonly keys: unknown[];
  /** `argsKey` results joined, so entries for other args stay cached. */
  readonly bucket: string;
  readonly value: V;
  readonly journey: Path[];
}

class KeySize extends Error {
  message = 'Keys must include at least one member';
}
