import { isImmutable } from '../schemas/ImmutableUtils.js';
import { EntityPath } from '../types.js';
import { GetDependency } from '../WeakDependencyMap.js';

export function getEntities<K extends object>(
  state: State<K>,
): GetDependency<EntityPath, K> {
  const entityIsImmutable = isImmutable(state);

  if (entityIsImmutable) {
    return ({ key, pk }: EntityPath) => state.getIn([key, pk]);
  } else {
    return ({ key, pk }: EntityPath) => state[key]?.[pk];
  }
}

export type State<K extends object> =
  | Record<string, Record<string, K>>
  | { getIn(path: [string, string]): K };

export type GetEntity = GetDependency<EntityPath>;
