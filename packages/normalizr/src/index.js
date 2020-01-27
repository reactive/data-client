import * as ImmutableUtils from './schemas/ImmutableUtils';
import EntitySchema from './schemas/Entity';
import UnionSchema from './schemas/Union';
import ValuesSchema from './schemas/Values';
import ArraySchema, * as ArrayUtils from './schemas/Array';
import ObjectSchema, * as ObjectUtils from './schemas/Object';

const visit = (value, parent, key, schema, addEntity, visitedEntities) => {
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

const addEntities = (entities, indexes) => (
  schema,
  processedEntity,
  value,
  parent,
  key,
) => {
  const schemaKey = schema.key;
  const id = schema.getId(value, parent, key);
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

export const schema = {
  Array: ArraySchema,
  Entity: EntitySchema,
  Object: ObjectSchema,
  Union: UnionSchema,
  Values: ValuesSchema,
};

function expectedSchemaType(schema) {
  return ['object', 'function'].includes(typeof schema)
    ? 'object'
    : typeof schema;
}

export const normalize = (input, schema) => {
  const schemaType = expectedSchemaType(schema);
  if (input === null || typeof input !== schemaType) {
    throw new Error(
      `Unexpected input given to normalize. Expected type to be "${schemaType}", found "${
        input === null ? 'null' : typeof input
      }".`,
    );
  }

  const entities = {};
  const indexes = {};
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

const unvisitEntity = (id, schema, unvisit, getEntity, cache) => {
  const entity = getEntity(id, schema);
  if (typeof entity !== 'object' || entity === null) {
    return [entity, false];
  }

  if (!cache[schema.key]) {
    cache[schema.key] = {};
  }

  let found = true;
  if (!cache[schema.key][id]) {
    // Ensure we don't mutate it non-immutable objects
    const entityCopy = ImmutableUtils.isImmutable(entity)
      ? entity
      : { ...entity };

    // Need to set this first so that if it is referenced further within the
    // denormalization the reference will already exist.
    cache[schema.key][id] = entityCopy;
    [cache[schema.key][id], found] = schema.denormalize(entityCopy, unvisit);
  }

  return [cache[schema.key][id], found];
};

const getUnvisit = entities => {
  const cache = {};
  const getEntity = getEntities(entities);

  return [
    function unvisit(input, schema) {
      if (!schema) return [input, true];

      if (
        typeof schema === 'object' &&
        (!schema.denormalize || typeof schema.denormalize !== 'function')
      ) {
        const method = Array.isArray(schema)
          ? ArrayUtils.denormalize
          : ObjectUtils.denormalize;
        return method(schema, input, unvisit);
      }

      // null is considered intentional, thus always 'found' as true
      if (input === null) {
        return [input, true];
      }

      if (
        typeof schema.getId === 'function' &&
        typeof schema.normalize === 'function'
      ) {
        // unvisitEntity just can't handle undefined
        if (input === undefined) {
          return [input, false];
        }
        return unvisitEntity(input, schema, unvisit, getEntity, cache);
      }

      if (typeof schema.denormalize === 'function') {
        return schema.denormalize(input, unvisit);
      }

      return [input, true];
    },
    cache,
  ];
};

const getEntities = entities => {
  const isImmutable = ImmutableUtils.isImmutable(entities);

  return (entityOrId, schema) => {
    const schemaKey = schema.key;

    if (typeof entityOrId === 'object') {
      return entityOrId;
    }

    if (isImmutable) {
      return entities.getIn([schemaKey, entityOrId.toString()]);
    }

    return entities[schemaKey] && entities[schemaKey][entityOrId];
  };
};

export const denormalizeAndTracked = (input, schema, entities) => {
  /* istanbul ignore next */
  // eslint-disable-next-line no-undef
  if (process.env.NODE_ENV !== 'production' && schema === undefined)
    throw new Error('shema needed');
  if (typeof input !== 'undefined') {
    const [unvisit, cache] = getUnvisit(entities);
    return [...unvisit(input, schema), cache];
  }
  return [undefined, false, {}];
};

export const denormalize = (input, schema, entities) =>
  denormalizeAndTracked(input, schema, entities).slice(0, 2);
