import LocalCache from './localCache.js';
import type { Denormalize, DenormalizeNullable } from './types.js';
import getUnvisit from './unvisit.js';
import { getEntities } from './WeakEntityMap.js';
import type { Schema } from '../../../../interface.js';

export const denormalize = <S extends Schema>(
  input: any,
  schema: S | undefined,
  entities: any,
): Denormalize<S> | DenormalizeNullable<S> => {
  // undefined means don't do anything
  if (schema === undefined || input === undefined) {
    return input as any;
  }

  return getUnvisit(getEntities(entities), new LocalCache())(input, schema)[0];
};
it('[helper file in test folder]', () => {});
