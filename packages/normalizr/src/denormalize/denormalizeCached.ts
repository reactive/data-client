import GlobalCache from './globalCache.js';
import getUnvisit from './unvisit.js';
import type { Schema } from '../interface.js';
import type {
  DenormalizeNullable,
  EntityCache,
  Path,
  ResultCache,
} from '../types.js';
import WeakEntityMap, { getEntities } from '../WeakEntityMap.js';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function denormalize<S extends Schema>(
  input: unknown,
  schema: S | undefined,
  entities: any,
  entityCache: EntityCache = {},
  resultCache: ResultCache = new WeakEntityMap(),
  args: readonly any[] = [],
): {
  data: DenormalizeNullable<S> | symbol;
  paths: Path[];
} {
  // undefined means don't do anything
  if (schema === undefined) {
    return { data: input as any, paths: [] };
  }
  if (input === undefined) {
    return { data: undefined as any, paths: [] };
  }
  const getEntity = getEntities(entities);

  return getUnvisit(
    getEntity,
    new GlobalCache(getEntity, entityCache, resultCache),
    args,
  )(input, schema);
}
