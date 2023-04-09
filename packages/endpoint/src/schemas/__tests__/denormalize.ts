import {
  denormalizeCached as denormalizeCore,
  Schema,
  DenormalizeCache,
  WeakEntityMap,
  Denormalize,
  DenormalizeNullable,
} from '@rest-hooks/normalizr';

export const denormalizeSimple = <S extends Schema>(
  input: any,
  schema: S | undefined,
  entities: any,
  entityCache: DenormalizeCache['entities'] = {},
  resultCache: DenormalizeCache['results'][string] = new WeakEntityMap(),
):
  | [denormalized: Denormalize<S>, deleted: false]
  | [denormalized: DenormalizeNullable<S>, deleted: true]
  | [denormalized: DenormalizeNullable<S>, deleted: boolean] =>
  denormalizeCore(input, schema, entities, entityCache, resultCache).slice(
    0,
    2,
  ) as any;

export default denormalizeSimple;

it('should', () => {});
