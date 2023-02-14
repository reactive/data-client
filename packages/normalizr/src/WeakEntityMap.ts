import { isImmutable } from './schemas/ImmutableUtils.js';

/** Maps entity dependencies to a value (usually their denormalized form)
 *
 * Dependencies store `Path` to enable quick traversal using only `State`
 * If *any* members of the dependency get cleaned up, so does that key/value pair get removed.
 */
export default class WeakEntityMap<K extends object, V> {
  readonly next = new WeakMap<K, Link<K, V>>();

  get(entity: K, getEntity: GetEntity<K>) {
    let curLink = this.next.get(entity);
    if (!curLink) return;
    while (curLink.nextPath) {
      const nextEntity = getEntity(curLink.nextPath);
      curLink = curLink.next.get(nextEntity);
      if (!curLink) return;
    }
    // curLink exists, but has no path - so must have a value
    return curLink.value;
  }

  set(dependencies: Dep<K>[], value: V) {
    if (dependencies.length < 1) throw new KeySize();
    let curLink: Link<K, V> = this as { next: WeakMap<K, Link<K, V>> };
    for (const { entity, path } of dependencies) {
      let nextLink = curLink.next.get(entity);
      if (!nextLink) {
        nextLink = new Link<K, V>();
        curLink.next.set(entity, nextLink);
      }
      curLink.nextPath = path;
      curLink = nextLink;
    }
    // in case there used to be more
    delete curLink.nextPath;
    curLink.value = value;
  }

  /** Builds essentially the same intereface but binds entity state */
  static fromState<T extends WeakEntityMap<object, any>>(
    wem: T,
    state: State<Parameters<T['get']>[0]>,
  ) {
    const getEntity = getEntities(state);
    return {
      get(entity: Parameters<T['get']>[0]): ReturnType<T['get']> {
        return wem.get(entity, getEntity);
      },
      set(deps: Parameters<T['set']>[0], value: Parameters<T['set']>[1]) {
        wem.set(deps, value);
      },
    };
  }
}

function getEntities<K extends object>(state: State<K>): GetEntity<K> {
  const entityIsImmutable = isImmutable(state);

  if (entityIsImmutable) {
    return (lookup: Path) => state.getIn([lookup.key, lookup.pk]);
  } else {
    return (lookup: Path) => state[lookup.key][lookup.pk];
  }
}

type GetEntity<K> = (lookup: Path) => K;

/** Link in a chain */
class Link<K extends object, V> {
  next = new WeakMap<K, Link<K, V>>();
  declare value?: V;
  declare nextPath?: Path;
}

class KeySize extends Error {
  message = 'Keys must include at least one member';
}

export interface Path {
  key: string;
  pk: string;
}

export interface Dep<K = object> {
  path: Path;
  entity: K;
}

type State<K extends object> =
  | Record<string, Record<string, K>>
  | { getIn(path: [string, string]): K };
