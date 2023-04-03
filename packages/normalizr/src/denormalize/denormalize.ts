import LocalCache from './localCache.js';
import getUnvisit from './unvisit.js';
import type { Schema } from '../interface.js';
import type { Denormalize, DenormalizeNullable } from '../types.js';
import { getEntities } from '../WeakEntityMap.js';

export const denormalize = <S extends Schema>(
  input: any,
  schema: S | undefined,
  entities: any,
):
  | [denormalized: Denormalize<S>, found: true, deleted: false]
  | [denormalized: DenormalizeNullable<S>, found: boolean, deleted: true]
  | [denormalized: DenormalizeNullable<S>, found: false, deleted: boolean] => {
  // undefined means don't do anything
  if (schema === undefined) {
    return [input, true, false] as [any, boolean, boolean];
  }
  if (input === undefined) {
    return [undefined, false, false] as [any, boolean, boolean];
  }
  const getEntity = getEntities(entities);

  const ret = getUnvisit(getEntity, new LocalCache())(input, schema);
  return [ret[0], ret[1], ret[2]];
};
