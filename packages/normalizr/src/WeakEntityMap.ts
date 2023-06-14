import { isImmutable } from './schemas/ImmutableUtils.js';
import { Path } from './types.js';

/** Maps entity dependencies to a value (usually their denormalized form)
 *
 * Dependencies store `Path` to enable quick traversal using only `State`
 * If *any* members of the dependency get cleaned up, so does that key/value pair get removed.
 */
export default class WeakEntityMap<K extends object = object, V = any> {
  readonly next = new WeakMap<K, Link<K, V>>();
  nextPath: Path | undefined = undefined;

  get(entity: K, getEntity: GetEntity<K | symbol>) {
    let curLink = this.next.get(entity);
    if (!curLink) return EMPTY;
    while (curLink.nextPath) {
      const nextEntity = getEntity(curLink.nextPath);
      curLink = curLink.next.get(nextEntity as any);
      if (!curLink) return EMPTY;
    }
    // curLink exists, but has no path - so must have a value
    return [curLink.value, curLink.journey] as [V, Path[]];
  }

  set(dependencies: Dep<K>[], value: V) {
    if (dependencies.length < 1) throw new KeySize();
    let curLink: Link<K, V> = this as any;
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
    curLink.nextPath = undefined;
    curLink.value = value;
    // we could recompute this on get, but it would have a cost and we optimize for `get`
    curLink.journey = depToPaths(dependencies);
  }
}

const EMPTY = [undefined, undefined] as const;

export function getEntities<K extends object>(state: State<K>): GetEntity<K> {
  const entityIsImmutable = isImmutable(state);

  if (entityIsImmutable) {
    return ({ key, pk }: Path) => state.getIn([key, pk]);
  } else {
    return ({ key, pk }: Path) => state[key]?.[pk];
  }
}

export function depToPaths(dependencies: Dep[]) {
  const paths = dependencies.map(dep => dep.path);
  // the first item is the result input not an actual entity
  if (paths[0]?.pk === '') paths.shift();
  return paths;
}

export type GetEntity<K = object | symbol> = (lookup: Path) => K;

/** Link in a chain */
class Link<K extends object, V> {
  next = new WeakMap<K, Link<K, V>>();
  value: V | undefined = undefined;
  journey: Path[] = [];
  nextPath: Path | undefined = undefined;
}

class KeySize extends Error {
  message = 'Keys must include at least one member';
}

export interface Dep<K = object> {
  path: Path;
  entity: K;
}

type State<K extends object> =
  | Record<string, Record<string, K>>
  | { getIn(path: [string, string]): K };
