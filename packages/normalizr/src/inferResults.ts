import type {
  Schema,
  SchemaSimple,
  NormalizedIndex,
  EntityTable,
} from './interface.js';
import type { NormalizeNullable } from './types.js';
import { infer as objectInfer } from './schemas/Object.js';
import { infer as arrayInfer } from './schemas/Array.js';

/**
 * Build the result parameter to denormalize from schema alone.
 * Tries to compute the entity ids from params.
 */
export default function inferResults<S extends Schema>(
  schema: S,
  args: any[],
  indexes: NormalizedIndex,
  entities: EntityTable = {},
): NormalizeNullable<S> {
  // schema classes
  if (canInfer(schema)) {
    return schema.infer(args, indexes, inferResults, entities);
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
