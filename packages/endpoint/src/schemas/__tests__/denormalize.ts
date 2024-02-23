import {
  denormalizeCached as denormalizeCore,
  Schema,
  EntityCache,
  ResultCache,
  WeakEntityMap,
  Denormalize,
  DenormalizeNullable,
} from '@data-client/normalizr';

export const denormalizeSimple = <S extends Schema>(
  input: any,
  schema: S | undefined,
  entities: any,
  entityCache: EntityCache = {},
  resultCache: ResultCache = new WeakEntityMap(),
  args: any[] = [],
): Denormalize<S> | DenormalizeNullable<S> | symbol =>
  denormalizeCore(input, schema, entities, entityCache, resultCache, args)
    .data as any;

export default denormalizeSimple;

it('[helper file in test folder]', () => {});
