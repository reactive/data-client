import { Schema, schemas, NormalizeNullable } from '~/resource';
import { isEntity } from '~/resource/types';

/**
 * Build the result parameter to denormalize from schema alone.
 * Tries to compute the entity ids from params.
 */
export default function buildInferredResults<
  Params extends Readonly<object>,
  S extends Schema
>(schema: S, params: Params | null): NormalizeNullable<S> {
  if (isEntity(schema)) {
    if (!params) return undefined as any;
    const id = schema.getId(params, undefined, '');
    // Was unable to infer the entity's primary key from params
    if (id === undefined || id === '') return undefined as any;
    return id as any;
  }
  if (schema instanceof schemas.Union) {
    const discriminatedSchema = schema.inferSchema(params, undefined, '');
    // Was unable to infer the entity's schema from params
    if (discriminatedSchema === undefined) return undefined as any;
    return {
      id: buildInferredResults(discriminatedSchema, params),
      schema: schema.getSchemaAttribute(params, parent, ''),
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
    if (!isSchema(o[k])) {
      resultObject[k] = o[k];
    } else {
      resultObject[k] = buildInferredResults(o[k], params);
    }
  }
  return resultObject;
}

function isSchema(candidate: any) {
  // TODO: improve detection
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    candidate !== undefined
  );
}
