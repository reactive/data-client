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
 * Only the first dependency is a `WeakMap` key, so a cached value is
 * collected with it. The rest are stored on the entry and compared by
 * identity on `get`. Keeping one level of `WeakMap` matters: garbage
 * collectors resolve nested `WeakMap`s one level per marking pass, and
 * Hermes rescans every `WeakMap` entry in the heap on each pass, so a chain
 * as long as the dependency list stalls every old-generation collection.
 *
 * String-keyed dependencies (used by `argsKey`) branch on a `Map` keyed by
 * the value `path(args)` returns, so each argument set keeps its own entries
 * and a lookup only checks its own.
 */
export default class WeakDependencyMap<
  Path,
  K extends object = object,
  V = any,
> {
  private readonly next = new WeakMap<K, Node<Path, V>>();
  /** Sticky: true once any function-typed (`argsKey`) dep has been stored. */
  private hasStr = false;

  get(
    entity: K,
    getDependency: GetDependency<Path, K | symbol>,
    args: readonly any[] = [],
  ) {
    let node = this.next.get(entity);
    while (node) {
      const { entries } = node;
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (matches(entry, getDependency, args)) {
          entry.hit = true;
          if (i > 0) {
            entries.splice(i, 1);
            entries.unshift(entry);
          }
          return [entry.value, entry.journey] as readonly [V, Path[]];
        }
      }
      if (!node.fn) break;
      node = node.children?.get(node.fn(args) ?? UNDEF_KEY);
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
    const root = (dependencies[0].entity ?? UNDEF) as K;
    let node = this.next.get(root);
    const paths = new Array<Path | KeyFn>(dependencies.length - 1);
    const keys = new Array<unknown>(dependencies.length - 1);
    for (let i = 1; i < dependencies.length; i++) {
      const dep = dependencies[i];
      paths[i - 1] = dep.path;
      if (typeof dep.path === 'function') {
        this.hasStr = true;
        const k = (dep.path as KeyFn)(args) ?? UNDEF_KEY;
        keys[i - 1] = k;
        if (!node) {
          node = newNode(undefined);
          this.next.set(root, node);
        }
        node.fn = dep.path as KeyFn;
        if (!node.children) node.children = new Map();
        let child = node.children.get(k);
        if (!child) {
          child = newNode(undefined);
          node.children.set(k, child);
        }
        node = child;
      } else {
        keys[i - 1] = dep.entity ?? UNDEF;
      }
    }
    const entry: Entry<Path, V> = {
      paths,
      keys,
      value,
      // we could recompute this on get, but it would have a cost and we optimize for `get`
      journey: journey ?? (dependencies.map(d => d.path) as Path[]),
      hit: false,
    };
    if (!node) {
      this.next.set(root, newNode(entry));
      return;
    }
    // Two entries per argument set, so a store that flips back still hits.
    // A pending transition does that: React retries it with freshly built
    // entities between urgent renders of the committed store. So when full,
    // drop the previous newest if nothing read it again (a one-off), else the
    // least recently used.
    const { entries } = node;
    if (entries.length === 0) {
      entries.push(entry);
      return;
    }
    if (entries.length === 1 || entries[0].hit) entries[1] = entries[0];
    entries[0] = entry;
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

/** Entries for one set of `argsKey` results (at most two, most recent first),
 * and the branch on the next one. */
interface Node<Path, V> {
  entries: Entry<Path, V>[];
  /** The next `argsKey` dependency; its result picks the child. */
  fn: KeyFn | undefined;
  children: Map<string, Node<Path, V>> | undefined;
}

function newNode<Path, V>(entry: Entry<Path, V> | undefined): Node<Path, V> {
  return {
    entries: entry ? [entry] : [],
    fn: undefined,
    children: undefined,
  };
}

/** One cached value: the dependencies after the first, and what they resolved to. */
interface Entry<Path, V> {
  readonly paths: (Path | KeyFn)[];
  /** Entity reference (or `UNDEF`) for entity paths; `argsKey` result for function paths. */
  readonly keys: unknown[];
  readonly value: V;
  readonly journey: Path[];
  /** Read again since it was set. */
  hit: boolean;
}

class KeySize extends Error {
  message = 'Keys must include at least one member';
}
