import { denormalize } from './denormalize.js';
import { normalize } from './normalize.js';
import WeakListMap from './WeakListMap.js';
import * as schema from './schema.js';
import Entity, { isEntity } from './entities/Entity.js';
export { default as inferResults } from './inferResults.js';
export { DELETED } from './special.js';
export { default as validateRequired } from './entities/validatRequired.js';

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
} from './types.js';

export { denormalize, schema, normalize, Entity, isEntity, WeakListMap };
