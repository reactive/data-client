import type {
  Schema,
  SchemaSimple,
  NormalizedIndex,
  EntityTable,
} from './interface.js';
import { queryKey as arrayQuery } from './schemas/Array.js';
import { queryKey as objectQuery } from './schemas/Object.js';
import type { NormalizeNullable } from './types.js';

/**
 * Build the result parameter to denormalize from schema alone.
 * Tries to compute the entity ids from params.
 */
export default function buildQueryKey<S extends Schema>(
  schema: S,
  args: any[],
  indexes: NormalizedIndex,
  entities: EntityTable,
): NormalizeNullable<S> {
  // schema classes
  if (canQuery(schema)) {
    return schema.queryKey(args, indexes, buildQueryKey, entities);
  }

  // plain case
  if (typeof schema === 'object' && schema) {
    const method = Array.isArray(schema) ? arrayQuery : objectQuery;
    return method(schema, args, indexes, buildQueryKey, entities);
  }

  // fallback for things like null or undefined
  return schema as any;
}

function canQuery(schema: Schema): schema is Pick<SchemaSimple, 'queryKey'> {
  return !!schema && typeof (schema as any).queryKey === 'function';
}

// this only works if entity does a lookup first to see if its entity is 'found'
export function validateQueryKey(queryKey: unknown) {
  if (queryKey === undefined) return false;
  if (queryKey && typeof queryKey === 'object' && !Array.isArray(queryKey)) {
    return Object.values(queryKey).every(validateQueryKey);
  }
  return true;
}
