Object.hasOwn =
  Object.hasOwn ||
  /* istanbul ignore next */ function hasOwn(it, key) {
    return Object.prototype.hasOwnProperty.call(it, key);
  };
import { denormalize } from './denormalize/denormalize.js';
import { isEntity } from './isEntity.js';
import { normalize } from './normalize.js';
import WeakEntityMap from './WeakEntityMap.js';

export { default as MemoCache } from './denormalize/MemoCache.js';
export type {
  AbstractInstanceType,
  NormalizeReturnType,
  NormalizedSchema,
  EntityCache,
  EndpointsCache,
  Path,
  Denormalize,
  DenormalizeNullable,
  Normalize,
  NormalizeNullable,
  SchemaArgs,
} from './types.js';
export * from './endpoint/types.js';
export * from './interface.js';
export * from './Expiry.js';
export { INVALID } from './denormalize/symbol.js';

export { denormalize, normalize, isEntity, WeakEntityMap };
