import GlobalCache from './globalCache.js';
import getUnvisit from './unvisit.js';
import type { Schema } from '../interface.js';
import type {
  Denormalize,
  DenormalizeNullable,
  DenormalizeCache,
  Path,
} from '../types.js';
import WeakEntityMap, { getEntities } from '../WeakEntityMap.js';

type DenormalizeReturn<S extends Schema> =
  | [
      denormalized: Denormalize<S>,
      found: true,
      deleted: false,
      entityPaths: Path[],
    ]
  | [
      denormalized: DenormalizeNullable<S>,
      found: boolean,
      deleted: true,
      entityPaths: Path[],
    ]
  | [
      denormalized: DenormalizeNullable<S>,
      found: false,
      deleted: boolean,
      entityPaths: Path[],
    ];

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const denormalize = <S extends Schema>(
  input: unknown,
  schema: S | undefined,
  entities: any,
  entityCache: DenormalizeCache['entities'] = {},
  resultCache: DenormalizeCache['results'][string] = new WeakEntityMap(),
): DenormalizeReturn<S> => {
  // undefined means don't do anything
  if (schema === undefined) {
    return [input, true, false, []] as [any, boolean, boolean, any[]];
  }
  if (input === undefined) {
    return [undefined, false, false, []] as [any, boolean, boolean, any[]];
  }
  const getEntity = getEntities(entities);

  return getUnvisit(
    getEntity,
    new GlobalCache(getEntity, entityCache, resultCache),
  )(input, schema);
};
