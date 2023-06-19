import {
  denormalizeCached as denormalizeCore,
  Schema,
  DenormalizeCache,
  WeakEntityMap,
  Denormalize,
  DenormalizeNullable,
} from '@data-client/normalizr';

export const denormalizeSimple = <S extends Schema>(
  input: any,
  schema: S | undefined,
  entities: any,
  entityCache: DenormalizeCache['entities'] = {},
  resultCache: DenormalizeCache['results'][string] = new WeakEntityMap(),
): Denormalize<S> | DenormalizeNullable<S> | symbol =>
  denormalizeCore(input, schema, entities, entityCache, resultCache)
    .data as any;

export default denormalizeSimple;

it('should', () => {});
