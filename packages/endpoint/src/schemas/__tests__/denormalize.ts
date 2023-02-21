import {
  denormalize as denormalizeCore,
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
  | [denormalized: Denormalize<S>, found: true, deleted: false]
  | [denormalized: DenormalizeNullable<S>, found: boolean, deleted: true]
  | [denormalized: DenormalizeNullable<S>, found: false, deleted: boolean] =>
  denormalizeCore(input, schema, entities, entityCache, resultCache).slice(
    0,
    3,
  ) as any;

export default denormalizeSimple;

it('should', () => {});
