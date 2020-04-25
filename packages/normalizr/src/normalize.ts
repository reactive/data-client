import * as ArrayUtils from './schemas/Array';
import * as ObjectUtils from './schemas/Object';
import {
  NormalizeNullable,
  NormalizedSchema,
  Schema,
  NormalizedIndex,
} from './types';

const visit = (
  value: any,
  parent: any,
  key: any,
  schema: any,
  addEntity: any,
  visitedEntities: any,
) => {
  if (typeof value !== 'object' || !value || !schema) {
    return value;
  }

  if (
    typeof schema === 'object' &&
    (!schema.normalize || typeof schema.normalize !== 'function')
  ) {
    const method = Array.isArray(schema)
      ? ArrayUtils.normalize
      : ObjectUtils.normalize;
    return method(
      schema,
      value,
      parent,
      key,
      visit,
      addEntity,
      visitedEntities,
    );
  }

  return schema.normalize(
    value,
    parent,
    key,
    visit,
    addEntity,
    visitedEntities,
  );
};

const addEntities = (entities: Record<string, any>, indexes: any) => (
  schema: any,
  processedEntity: any,
  value: any,
  parent: any,
  key: string,
) => {
  const schemaKey = schema.key;
  const id = schema.pk(processedEntity, parent, key);
  if (!(schemaKey in entities)) {
    entities[schemaKey] = {};
  }

  const existingEntity = entities[schemaKey][id];
  if (existingEntity) {
    entities[schemaKey][id] = schema.merge(existingEntity, processedEntity);
  } else {
    entities[schemaKey][id] = processedEntity;
  }
  // update index
  if (Array.isArray(schema.indexes)) {
    const entity = entities[schemaKey][id];
    if (!(schemaKey in indexes)) {
      indexes[schemaKey] = {};
    }
    for (const index of schema.indexes) {
      if (!(index in indexes[schemaKey])) {
        indexes[schemaKey][index] = {};
      }
      const indexMap = indexes[schemaKey][index];
      if (existingEntity) {
        delete indexMap[existingEntity[index]];
      }
      if (index in entity) {
        indexMap[entity[index]] = id;
      } /* istanbul ignore next */ else if (
        // eslint-disable-next-line no-undef
        process.env.NODE_ENV !== 'production'
      ) {
        console.warn(`Index not found in entity. Indexes must be top-level members of your entity.
Index: ${index}
Entity: ${JSON.stringify(entity, undefined, 2)}`);
      }
    }
  }
};

function expectedSchemaType(schema: Schema) {
  return ['object', 'function'].includes(typeof schema)
    ? 'object'
    : typeof schema;
}

export const normalize = <
  S extends Schema = Schema,
  E extends Record<string, Record<string, any>> = Record<
    string,
    Record<string, any>
  >,
  R = NormalizeNullable<S>
>(
  input: any,
  schema: S,
): NormalizedSchema<E, R> => {
  const schemaType = expectedSchemaType(schema);
  if (input === null || typeof input !== schemaType) {
    throw new Error(
      `Unexpected input given to normalize. Expected type to be "${schemaType}", found "${
        input === null ? 'null' : typeof input
      }".`,
    );
  }

  const entities: E = {} as any;
  const indexes: NormalizedIndex = {};
  const addEntity = addEntities(entities, indexes);
  const visitedEntities = {};

  const result = visit(
    input,
    input,
    undefined,
    schema,
    addEntity,
    visitedEntities,
  );
  return { entities, indexes, result };
};
