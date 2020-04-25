import { NormalizedIndex, isEntity } from '@rest-hooks/normalizr';
import { Schema, schemas, NormalizeNullable } from 'rest-hooks/resource';

/**
 * Build the result parameter to denormalize from schema alone.
 * Tries to compute the entity ids from params.
 */
export default function buildInferredResults<
  Params extends Readonly<object>,
  S extends Schema
>(
  schema: S,
  params: Params | null,
  indexes: NormalizedIndex,
): NormalizeNullable<S> {
  if (!isSchema(schema)) {
    return schema as any;
  }
  if (isEntity(schema)) {
    if (!params) return undefined as any;
    const id = schema.pk(params, undefined, '');
    // Was able to infer the entity's primary key from params
    if (id !== undefined && id !== '') return id as any;
    // now attempt lookup in indexes
    const indexName = indexFromParams(params, schema.indexes);
    if (indexName && indexes[schema.key]) {
      // 'as Record<string, any>': indexName can only be found if params is a string key'd object
      return indexes[schema.key][indexName][
        (params as Record<string, any>)[indexName]
      ] as any;
    }
    return undefined as any;
  }
  if (schema instanceof schemas.Union) {
    const discriminatedSchema = schema.inferSchema(params, undefined, '');
    // Was unable to infer the entity's schema from params
    if (discriminatedSchema === undefined) return undefined as any;
    return {
      id: buildInferredResults(discriminatedSchema, params, indexes),
      schema: schema.getSchemaAttribute(params, undefined, ''),
    } as any;
  }
  if (schema instanceof schemas.Array || Array.isArray(schema)) {
    return undefined as any;
  }
  if (schema instanceof schemas.Values) {
    return {} as any;
  }
  const o = schema instanceof schemas.Object ? (schema as any).schema : schema;
  const resultObject = {} as any;
  for (const k in o) {
    resultObject[k] = buildInferredResults(o[k], params, indexes);
  }
  return resultObject;
}

function isSchema(candidate: any) {
  // TODO: improve detection
  return (
    ['object', 'function'].includes(typeof candidate) &&
    candidate !== null &&
    candidate !== undefined
  );
}

function indexFromParams<I extends string>(
  params: Readonly<object>,
  indexes?: Readonly<I[]>,
) {
  if (!indexes) return undefined;
  for (const index of indexes) {
    if (index in params) return index;
  }
  return undefined;
}
