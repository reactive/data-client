import { getEntities } from './getEntities.js';
import LocalCache from './localCache.js';
import getUnvisit from './unvisit.js';
import type { Schema } from '../interface.js';
import type { DenormalizeNullable } from '../types.js';

export function denormalize<S extends Schema>(
  input: any,
  schema: S | undefined,
  entities: any,
  args: readonly any[] = [],
): DenormalizeNullable<S> | symbol {
  // undefined means don't do anything
  if (schema === undefined || input === undefined) {
    return input as any;
  }

  return getUnvisit(
    getEntities(entities),
    new LocalCache(),
    args,
  )(input, schema).data;
}
