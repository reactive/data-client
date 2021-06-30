import { denormalize } from '@rest-hooks/normalizr/denormalize';
import { normalize } from '@rest-hooks/normalizr/normalize';
import WeakListMap from '@rest-hooks/normalizr/WeakListMap';
import * as schema from '@rest-hooks/normalizr/schema';
import Entity, { isEntity } from '@rest-hooks/normalizr/entities/Entity';
export { default as inferResults } from '@rest-hooks/normalizr/inferResults';
export { DELETED } from '@rest-hooks/normalizr/special';

export type {
  AbstractInstanceType,
  Schema,
  Normalize,
  NormalizeNullable,
  NormalizedIndex,
  NormalizeReturnType,
  NormalizedSchema,
  Denormalize,
  DenormalizeNullable,
  DenormalizeReturnType,
  DenormalizeCache,
} from '@rest-hooks/normalizr/types';

export { denormalize, schema, normalize, Entity, isEntity, WeakListMap };
