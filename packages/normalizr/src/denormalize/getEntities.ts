import { DelegateImmutable } from '../immutable.js';
import type { EntityPath } from '../interface.js';
import { PlainDelegate } from '../memo/Delegate.js';
import type { GetDependency } from '../memo/WeakDependencyMap.js';
import { isImmutable } from '../schemas/ImmutableUtils.js';

export function getEntities<K extends object>(
  state: State<K>,
): GetDependency<EntityPath, K | symbol> {
  const entityIsImmutable = isImmutable(state);

  if (entityIsImmutable) {
    return DelegateImmutable.forDenorm(state as any) as any;
  } else {
    return PlainDelegate.forDenorm(state as any) as any;
  }
}

export type State<K extends object> =
  | Record<string, Record<string, K>>
  | { getIn(path: [string, string]): K };

export type GetEntity = GetDependency<EntityPath>;
