import LocalCache from './localCache.js';
import getUnvisit from './unvisit.js';
import type { Schema } from '../interface.js';
import type { DenormalizeNullable } from '../types.js';
import type { INVALID } from './symbol.js';
import { MemoPolicy } from '../memo/Policy.imm.js';

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
    MemoPolicy.getEntities(entities),
    new LocalCache(),
    args,
  )(schema, input).data;
}
