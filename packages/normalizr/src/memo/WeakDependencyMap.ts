import { INVALID } from '../denormalize/symbol.js';

/** Function path used by `argsKey` deps. Distinguished from object paths
 * via `typeof === 'function'`. */
export type KeyFn = (args: readonly any[]) => string | undefined;

/** Sentinel string used in place of `undefined` for string-keyed deps so we
 * can perform Map lookups consistently. */
const UNDEF_KEY = '\0';

const UNDEF_DEP = {};
const NULL_DEP = {};
const INVALID_DEP = {};
const otherDeps = new Map<unknown, object>();

/** `WeakMap` key for an entity value: the object or function itself, or a
 * fixed stand-in for `undefined`, `null` or `INVALID`. Checked on every
 * dependency, so the common values never need a lookup. */
export function depKey(entity: unknown): object {
  if (typeof entity === 'object') return entity ?? NULL_DEP;
  if (entity === undefined) return UNDEF_DEP;
  if (typeof entity === 'function') return entity;
  if (entity === INVALID) return INVALID_DEP;
  // normalize never stores other values; a stand-in for one is never freed
  let key = otherDeps.get(entity);
  if (!key) {
    key = {};
    otherDeps.set(entity, key);
  }
  return key;
}

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
 * and a lookup only checks its own. A node keeps one branch per `argsKey`
 * function: which one a computation reaches first can depend on the
 * entities before it (a missing entity skips its nested `argsKey`).
 *
 * Invariants every change must keep: "Memo invariants" in
 * `packages/normalizr/AGENTS.md`.
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
    const root = this.next.get(depKey(entity) as K);
    const node = root && find(root, getDependency, args);
    if (!node) return EMPTY;
    const entry = node.entries[0];
    return [entry.value, entry.journey] as readonly [V, Path[]];
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
    const root = depKey(dependencies[0].entity) as K;
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
        if (!node.branches) node.branches = [];
        let branch = node.branches.find(b => b.fn === dep.path);
        if (!branch) {
          branch = { fn: dep.path as KeyFn, children: new Map() };
          node.branches.push(branch);
        }
        let child = branch.children.get(k);
        if (!child) {
          child = newNode(undefined);
          branch.children.set(k, child);
        }
        node = child;
      } else {
        keys[i - 1] = depKey(dep.entity);
      }
    }
    const entry: Entry<Path, V> = {
      paths,
      keys,
      value,
      // we could recompute this on get, but it would have a cost and we optimize for `get`
      journey: journey ?? (dependencies.map(d => d.path) as Path[]),
    };
    if (!node) {
      this.next.set(root, newNode(entry));
      return;
    }
    // A store can flip back to a version it already showed: React renders the
    // committed store between retries of a pending transition, which build new
    // entities each time, and rolling back an optimistic update returns to the
    // entities from before it. So beyond the newest entries, keep the one the
    // store last flipped back to (or the first one, until a flip happens).
    const { entries } = node;
    if (!node.kept) node.kept = entry;
    entries.unshift(entry);
    if (entries.length > MAX_ENTRIES) {
      const last = entries.length - 1;
      entries.splice(entries[last] === node.kept ? last - 1 : last, 1);
    }
  }

  /** True once any `argsKey`-style dep has been written. Consumers can use
   * this to skip function-stripping work on the hit path when false. */
  get hasStringDeps(): boolean {
    return this.hasStr;
  }
}

/** The node at or below `node` with an entry that matches the store, if any;
 * that entry is moved to the front of its entries. A loop, not recursion:
 * a list can record one `argsKey` per row, so the nodes nest that deep. */
function find<Path, K extends object, V>(
  node: Node<Path, V> | undefined,
  getDependency: GetDependency<Path, K | symbol>,
  args: readonly any[],
): Node<Path, V> | undefined {
  // other branches to try, only allocated when a node has more than one
  let pending: Node<Path, V>[] | undefined;
  while (node) {
    const { entries, branches } = node;
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (matches(entry, getDependency)) {
        if (i > 0) {
          // read back after something newer was cached: the store flipped
          // back to this version, so it is the one to keep
          node.kept = entry;
          entries.splice(i, 1);
          entries.unshift(entry);
        }
        return node;
      }
    }
    let next: Node<Path, V> | undefined;
    if (branches) {
      for (let b = 0; b < branches.length; b++) {
        const { fn, children } = branches[b];
        const child = children.get(fn(args) ?? UNDEF_KEY);
        if (!child) continue;
        if (!next) next = child;
        else (pending || (pending = [])).push(child);
      }
    }
    node = next ?? pending?.pop();
  }
}

function matches<Path, K extends object, V>(
  entry: Entry<Path, V>,
  getDependency: GetDependency<Path, K | symbol>,
): boolean {
  const { paths, keys } = entry;
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    // the route to this entry already picked every argsKey result
    if (typeof path === 'function') continue;
    if (depKey(getDependency(path as Path)) !== keys[i]) return false;
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

/** Entries kept per (first dependency, `argsKey` results). */
const MAX_ENTRIES = 3;

/** Entries for one set of `argsKey` results, most recently used first, and the
 * branches on the next one. */
interface Node<Path, V> {
  entries: Entry<Path, V>[];
  /** Never evicted: the entry most recently read back after a newer one. */
  kept: Entry<Path, V> | undefined;
  /** One per next `argsKey` dependency; its result picks the child. */
  branches: Branch<Path, V>[] | undefined;
}

interface Branch<Path, V> {
  readonly fn: KeyFn;
  readonly children: Map<string, Node<Path, V>>;
}

function newNode<Path, V>(entry: Entry<Path, V> | undefined): Node<Path, V> {
  return {
    entries: entry ? [entry] : [],
    kept: entry,
    branches: undefined,
  };
}

/** One cached value: the dependencies after the first, and what they resolved to. */
interface Entry<Path, V> {
  readonly paths: (Path | KeyFn)[];
  /** `depKey()` of the entity for entity paths; `argsKey` result for function paths. */
  readonly keys: unknown[];
  readonly value: V;
  readonly journey: Path[];
}

class KeySize extends Error {
  message = 'Keys must include at least one member';
}
