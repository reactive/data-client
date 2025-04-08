import { getEntities } from './getEntities.js';
import LocalCache from './localCache.js';
import getUnvisit from './unvisit.js';
import type { Schema } from '../interface.js';
import { isImmutable } from '../schemas/ImmutableUtils.js';
import type { DenormalizeNullable } from '../types.js';
import type { INVALID } from './symbol.js';

export function denormalize<S extends Schema>(
  schema: S | undefined,
  input: any,
  entities: any,
  args: readonly any[] = [],
): DenormalizeNullable<S> | typeof INVALID {
  // undefined means don't do anything
  if (schema === undefined || input === undefined) {
    return input as any;
  }

  return getUnvisit(
    getEntities(entities),
    new LocalCache(),
    args,
    isImmutable(entities),
  )(schema, input).data;
}
