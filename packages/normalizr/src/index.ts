import { denormalize } from './denormalize';
import { normalize } from './normalize';
import WeakListMap from './WeakListMap';
import * as schema from './schema';
import Entity, { isEntity } from './entities/Entity';
export { default as inferResults } from './inferResults';
export { DELETED } from './special';

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
} from './types';

export { denormalize, schema, normalize, Entity, isEntity, WeakListMap };
