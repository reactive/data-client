import { denormalize } from './denormalize/denormalize.js';
import { isEntity } from './isEntity.js';
import WeakDependencyMap from './memo/WeakDependencyMap.js';
import { normalize } from './normalize/normalize.js';

export { default as MemoCache } from './memo/MemoCache.js';
export { BaseDelegate } from './delegate/BaseDelegate.js';
export { MemoPolicy } from './memo/Policy.js';
export type {
  AbstractInstanceType,
  NormalizeReturnType,
  NormalizedSchema,
  Denormalize,
  DenormalizeNullable,
  Normalize,
  NormalizeNullable,
  SchemaArgs,
} from './types.js';
export type { NI } from './NoInfer.js';
export type {
  SetManySchema,
  SetManyValue,
  SetValue,
  SkipInfer,
} from './setTypes.js';
export * from './endpoint/types.js';
export * from './interface.js';
export type {
  EntityCache,
  EndpointsCache,
  DenormGetEntity,
  IMemoPolicy,
} from './memo/types.js';
export * from './Expiry.js';
export { INVALID } from './denormalize/symbol.js';
export { validateQueryKey } from './buildQueryKey.js';

export { denormalize, normalize, isEntity, WeakDependencyMap };
