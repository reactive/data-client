import {
  denormalizeCached as denormalizeCore,
  Schema,
  DenormalizeCache,
  WeakEntityMap,
  Denormalize,
  DenormalizeNullable,
  INVALID,
} from '@data-client/normalizr';

import { denormalize as legacyDenormalize } from './legacy-compat/denormalize';
import { denormalize as legacyDenormalize10 } from './legacy-compat/denormalize-v10.1/denormalizeCached';
import WeakListMap from './legacy-compat/WeakListMap';

export const denormalizeSimple = <S extends Schema>(
  input: any,
  schema: S | undefined,
  entities: any,
  entityCache: DenormalizeCache['entities'] = {},
  resultCache: DenormalizeCache['results'][string] = new WeakEntityMap(),
  args: any[] = [],
): Denormalize<S> | DenormalizeNullable<S> | symbol =>
  denormalizeCore(input, schema, entities, entityCache, resultCache, args)
    .data as any;

export default denormalizeSimple;

export const denormalizeLegacy = <S extends Schema>(
  input: unknown,
  schema: S | undefined,
  entities: any,
  entityCache: any = {},
  resultCache: WeakListMap<object, any> = new WeakListMap(),
) => {
  const [value, found, deleted] = legacyDenormalize(
    input,
    schema,
    entities,
    entityCache,
    resultCache,
  );
  if (deleted) return INVALID;
  return value;
};

export const denormalize10 = <S extends Schema>(
  input: unknown,
  schema: S | undefined,
  entities: any,
  entityCache: any = {},
  resultCache: WeakEntityMap<object, any> = new WeakEntityMap(),
) => {
  const [value, found, deleted] = legacyDenormalize10(
    input,
    schema,
    entities,
    entityCache,
    resultCache,
  );
  if (deleted) return INVALID;
  return value;
};

it('[helper file in test folder]', () => {});
