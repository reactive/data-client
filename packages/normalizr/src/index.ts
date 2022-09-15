import { denormalize } from './denormalize.js';
import { normalize } from './normalize.js';
import WeakListMap from './WeakListMap.js';
import { isEntity } from './isEntity.js';
export { default as inferResults } from './inferResults.js';
export { DELETED } from './special.js';

export type {
  AbstractInstanceType,
  NormalizeReturnType,
  NormalizedSchema,
  DenormalizeReturnType,
  DenormalizeCache,
} from './types.js';
export * from './endpoint/types.js';
export * from './interface.js';
export * from './Expiry.js';
export * from './normal.js';

export { denormalize, normalize, isEntity, WeakListMap };
