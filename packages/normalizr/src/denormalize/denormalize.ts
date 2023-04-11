import LocalCache from './localCache.js';
import getUnvisit from './unvisit.js';
import type { Schema } from '../interface.js';
import type { Denormalize, DenormalizeNullable } from '../types.js';
import { getEntities } from '../WeakEntityMap.js';

export const denormalize = <S extends Schema>(
  input: any,
  schema: S | undefined,
  entities: any,
): DenormalizeNullable<S> | symbol => {
  // undefined means don't do anything
  if (schema === undefined || input === undefined) {
    return input as any;
  }

  return getUnvisit(getEntities(entities), new LocalCache())(input, schema)
    .data;
};
