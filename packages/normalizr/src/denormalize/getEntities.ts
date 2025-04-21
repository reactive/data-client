import { Delegate } from '../immutable.js';
import type { EntityPath } from '../interface.js';
import { Delegate as PlainDelegate } from '../memo/Delegate.js';
import type { GetDependency } from '../memo/WeakDependencyMap.js';
import { isImmutable } from '../schemas/ImmutableUtils.js';

export function getEntities<K extends object>(
  state: State<K>,
): GetDependency<EntityPath, K | symbol> {
  const entityIsImmutable = isImmutable(state);

  if (entityIsImmutable) {
    return Delegate.denormalize(state as any) as any;
  } else {
    return PlainDelegate.denormalize(state as any) as any;
  }
}

export type State<K extends object> =
  | Record<string, Record<string, K>>
  | { getIn(path: [string, string]): K };

export type GetEntity = GetDependency<EntityPath>;
