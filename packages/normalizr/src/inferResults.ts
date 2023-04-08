import type {
  Schema,
  SchemaSimple,
  NormalizedIndex,
  EntityTable,
} from './interface.js';
import { isEntity } from './isEntity.js';
import { infer as arrayInfer } from './schemas/Array.js';
import { infer as objectInfer } from './schemas/Object.js';
import type { NormalizeNullable } from './types.js';

/**
 * Build the result parameter to denormalize from schema alone.
 * Tries to compute the entity ids from params.
 */
export default function inferResults<S extends Schema>(
  schema: S,
  args: any[],
  indexes: NormalizedIndex,
  entities: EntityTable,
): NormalizeNullable<S> {
  // schema classes
  if (canInfer(schema)) {
    const ret = schema.infer(args, indexes, inferResults, entities);
    // TODO(breaking): back compatibility with endpoint@3.7 and less
    if (isEntity(schema) && ret !== undefined && !entities[schema.key]?.[ret]) {
      return undefined as any;
    }
    return ret;
  }

  // plain case
  if (typeof schema === 'object' && schema) {
    const method = Array.isArray(schema) ? arrayInfer : objectInfer;
    return method(schema, args, indexes, inferResults, entities);
  }

  // fallback for things like null or undefined
  return schema as any;
}

function canInfer(schema: Schema): schema is Pick<SchemaSimple, 'infer'> {
  return !!schema && typeof (schema as any).infer === 'function';
}

// this only works if entity does a lookup first to see if its entity is 'found'
export function validateInference(results: unknown) {
  if (results === undefined) return false;
  if (results && typeof results === 'object' && !Array.isArray(results)) {
    return Object.values(results).every(validateInference);
  }
  return true;
}
