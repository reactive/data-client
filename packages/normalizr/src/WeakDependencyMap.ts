import { UNDEF } from './denormalize/UNDEF.js';

/** Maps a (ordered) list of dependencies to a value.
 *
 * Useful as a memoization cache for flat/normalized stores.
 *
 * All dependencies are only weakly referenced, allowing automatic garbage collection
 * when any dependencies are no longer used.
 */
export default class WeakDependencyMap<
  Path,
  K extends object = object,
  V = any,
> {
  readonly next = new WeakMap<K, Link<Path, K, V>>();
  nextPath: Path | undefined = undefined;

  get(entity: K, getDependency: GetDependency<Path, K | symbol>) {
    let curLink = this.next.get(entity);
    if (!curLink) return EMPTY;
    while (curLink.nextPath) {
      // we cannot perform lookups with `undefined`, so we use a special object to represent undefined
      const nextEntity = getDependency(curLink.nextPath) ?? UNDEF;
      curLink = curLink.next.get(nextEntity as any);
      if (!curLink) return EMPTY;
    }
    // curLink exists, but has no path - so must have a value
    return [curLink.value, curLink.journey] as readonly [V, Path[]];
  }

  set(dependencies: Dep<Path, K>[], value: V) {
    if (dependencies.length < 1) throw new KeySize();
    let curLink: Link<Path, K, V> = this as any;
    for (const { entity, path } of dependencies) {
      let nextLink = curLink.next.get(entity);
      if (!nextLink) {
        nextLink = new Link<Path, K, V>();
        // void members are represented as a symbol so we can lookup
        curLink.next.set(entity ?? UNDEF, nextLink);
      }
      curLink.nextPath = path;
      curLink = nextLink;
    }
    // in case there used to be more
    curLink.nextPath = undefined;
    curLink.value = value;
    // we could recompute this on get, but it would have a cost and we optimize for `get`
    curLink.journey = dependencies.map(dep => dep.path);
  }
}

export type GetDependency<Path, K = object | symbol> = (lookup: Path) => K;

export interface Dep<Path, K = object> {
  path: Path;
  entity: K;
}

const EMPTY = [undefined, undefined] as const;

/** Link in a chain */
class Link<Path, K extends object, V> {
  next = new WeakMap<K, Link<Path, K, V>>();
  value: V | undefined = undefined;
  journey: Path[] = [];
  nextPath: Path | undefined = undefined;
}

class KeySize extends Error {
  message = 'Keys must include at least one member';
}
