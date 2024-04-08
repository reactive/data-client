Object.hasOwn =
  Object.hasOwn ||
  /* istanbul ignore next */ function hasOwn(it, key) {
    return Object.prototype.hasOwnProperty.call(it, key);
  };
import { denormalize } from './denormalize/denormalize.js';
import { isEntity } from './isEntity.js';
import WeakDependencyMap from './memo/WeakDependencyMap.js';
import { normalize } from './normalize.js';

export { default as MemoCache } from './memo/MemoCache.js';
export type {
  AbstractInstanceType,
  NormalizeReturnType,
  NormalizedSchema,
  EntityPath,
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
export { validateQueryKey } from './buildQueryKey.js';

export { denormalize, normalize, isEntity, WeakDependencyMap };
