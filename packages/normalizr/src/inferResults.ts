import {
  NormalizedIndex,
  NormalizeNullable,
  Schema,
} from '@rest-hooks/normalizr/types';
import { SchemaSimple } from '@rest-hooks/normalizr/schema';
import { infer as objectInfer } from '@rest-hooks/normalizr/schemas/Object';
import { infer as arrayInfer } from '@rest-hooks/normalizr/schemas/Array';

/**
 * Build the result parameter to denormalize from schema alone.
 * Tries to compute the entity ids from params.
 */
export default function inferResults<S extends Schema>(
  schema: S,
  args: any[],
  indexes: NormalizedIndex,
): NormalizeNullable<S> {
  // schema classes
  if (canInfer(schema)) {
    return schema.infer(args, indexes, inferResults);
  }

  // plain case
  if (typeof schema === 'object' && schema) {
    const method = Array.isArray(schema) ? arrayInfer : objectInfer;
    return method(schema, args, indexes, inferResults);
  }

  // fallback for things like null or undefined
  return schema as any;
}

function canInfer(schema: Schema): schema is Pick<SchemaSimple, 'infer'> {
  return !!schema && typeof (schema as any).infer === 'function';
}
