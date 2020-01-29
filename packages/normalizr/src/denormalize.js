import * as ImmutableUtils from './schemas/ImmutableUtils';
import * as ArrayUtils from './schemas/Array';
import * as ObjectUtils from './schemas/Object';

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

export const denormalize = (input, schema, entities) => {
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

export const denormalizeSimple = (input, schema, entities) =>
  denormalize(input, schema, entities).slice(0, 2);
