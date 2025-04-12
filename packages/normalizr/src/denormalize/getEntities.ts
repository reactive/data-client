import type { EntityPath } from '../interface.js';
import type { GetDependency } from '../memo/WeakDependencyMap.js';
import { isImmutable } from '../schemas/ImmutableUtils.js';

export function getEntities<K extends object>(
  state: State<K>,
): GetDependency<EntityPath, K> {
  const entityIsImmutable = isImmutable(state);

  if (entityIsImmutable) {
    return (path: EntityPath) => state.getIn(path);
  } else {
    return ([key, pk]: EntityPath) => state[key]?.[pk];
  }
}

export type State<K extends object> =
  | Record<string, Record<string, K>>
  | { getIn(path: [string, string]): K };

export type GetEntity = GetDependency<EntityPath>;
