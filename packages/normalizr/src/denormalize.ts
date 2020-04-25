import * as ImmutableUtils from './schemas/ImmutableUtils';
import * as ArrayUtils from './schemas/Array';
import * as ObjectUtils from './schemas/Object';
import { Denormalize, DenormalizeNullable, Schema } from './types';
import SimpleRecord from './entities/SimpleRecord';
import { isEntity } from './entities/Entity';

const unvisitEntity = (
  id: any,
  schema: any,
  unvisit: any,
  getEntity: any,
  cache: Record<string, any>,
): [any, boolean] => {
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
    const entityCopy =
      ImmutableUtils.isImmutable(entity) || entity instanceof SimpleRecord
        ? entity
        : { ...entity };

    // Need to set this first so that if it is referenced further within the
    // denormalization the reference will already exist.
    cache[schema.key][id] = entityCopy;
    [cache[schema.key][id], found] = schema.denormalize(entityCopy, unvisit);
  }

  return [cache[schema.key][id], found];
};

const getUnvisit = (entities: Record<string, any>) => {
  const cache = {};
  const getEntity = getEntities(entities);

  return [
    function unvisit(input: any, schema: any): [any, boolean] {
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

      if (isEntity(schema)) {
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
  ] as const;
};

const getEntities = (entities: Record<string, any>) => {
  const isImmutable = ImmutableUtils.isImmutable(entities);

  return (entityOrId: any, schema: any) => {
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

export const denormalize = <S extends Schema>(
  input: any,
  schema: S,
  entities: any,
):
  | [Denormalize<S>, true, Record<string, Record<string, any>>]
  | [DenormalizeNullable<S>, false, Record<string, Record<string, any>>] => {
  /* istanbul ignore next */
  // eslint-disable-next-line no-undef
  if (process.env.NODE_ENV !== 'production' && schema === undefined)
    throw new Error('shema needed');
  if (typeof input !== 'undefined') {
    const [unvisit, cache] = getUnvisit(entities);
    return [...unvisit(input, schema), cache] as any;
  }
  return [undefined, false, {}] as any;
};

export const denormalizeSimple = <S extends Schema>(
  input: any,
  schema: S,
  entities: any,
) => denormalize(input, schema, entities).slice(0, 2);
