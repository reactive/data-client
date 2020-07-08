import * as ImmutableUtils from './schemas/ImmutableUtils';
import * as ArrayUtils from './schemas/Array';
import * as ObjectUtils from './schemas/Object';
import { Denormalize, DenormalizeNullable, Schema } from './types';
import Entity, { isEntity } from './entities/Entity';
import FlatEntity from './entities/FlatEntity';
import { DELETED } from './special';

const unvisitEntity = (
  id: any,
  schema: any,
  unvisit: any,
  getEntity: any,
  cache: Record<string, any>,
): [any, boolean, boolean] => {
  const entity = getEntity(id, schema);
  if (entity === DELETED) {
    return [undefined, true, true];
  }
  if (typeof entity !== 'object' || entity === null) {
    return [entity, false, false];
  }

  if (!cache[schema.key]) {
    cache[schema.key] = {};
  }

  let found = true;
  let deleted = false;
  if (!cache[schema.key][id]) {
    // Ensure we don't mutate it non-immutable objects
    const entityCopy =
      ImmutableUtils.isImmutable(entity) || entity instanceof FlatEntity
        ? entity
        : schema.fromJS(entity);

    // Need to set this first so that if it is referenced further within the
    // denormalization the reference will already exist.
    cache[schema.key][id] = entityCopy;
    [cache[schema.key][id], found, deleted] = schema.denormalize(
      entityCopy,
      unvisit,
    );
  }

  return [cache[schema.key][id], found, deleted];
};

const getUnvisit = (entities: Record<string, any>) => {
  const cache = {};
  const getEntity = getEntities(entities);

  return [
    function unvisit(input: any, schema: any): [any, boolean, boolean] {
      if (!schema) return [input, true, false];

      if (!schema.denormalize || typeof schema.denormalize !== 'function') {
        if (typeof schema === 'function') {
          if (input instanceof schema) return [input, true, false];
          return [new schema(input), true, false];
        } else if (typeof schema === 'object') {
          const method = Array.isArray(schema)
            ? ArrayUtils.denormalize
            : ObjectUtils.denormalize;
          return method(schema, input, unvisit);
        }
      }

      // null is considered intentional, thus always 'found' as true
      if (input === null) {
        return [input, true, false];
      }

      if (isEntity(schema)) {
        // unvisitEntity just can't handle undefined
        if (input === undefined) {
          return [input, false, false];
        }
        return unvisitEntity(input, schema, unvisit, getEntity, cache);
      }

      if (typeof schema.denormalize === 'function') {
        return schema.denormalize(input, unvisit);
      }

      return [input, true, false];
    },
    cache,
  ] as const;
};

const getEntities = (entities: Record<string, any>) => {
  const isImmutable = ImmutableUtils.isImmutable(entities);

  return (entityOrId: Record<string, any> | string, schema: typeof Entity) => {
    const schemaKey = schema.key;

    if (typeof entityOrId === 'object') {
      return entityOrId;
    }

    if (isImmutable) {
      return entities.getIn([schemaKey, entityOrId]);
    }

    return entities[schemaKey] && entities[schemaKey][entityOrId];
  };
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const denormalize = <S extends Schema>(
  input: any,
  schema: S,
  entities: any,
):
  | [Denormalize<S>, true, false, Record<string, Record<string, any>>]
  | [
      DenormalizeNullable<S>,
      false,
      boolean,
      Record<string, Record<string, any>>,
    ]
  | [
      DenormalizeNullable<S>,
      boolean,
      true,
      Record<string, Record<string, any>>,
    ] => {
  /* istanbul ignore next */
  if (process.env.NODE_ENV !== 'production' && schema === undefined)
    throw new Error('schema needed');
  if (typeof input !== 'undefined') {
    const [unvisit, cache] = getUnvisit(entities);
    return [...unvisit(input, schema), cache] as any;
  }
  return [undefined, false, false, {}] as any;
};

export const denormalizeSimple = <S extends Schema>(
  input: any,
  schema: S,
  entities: any,
):
  | [Denormalize<S>, true, false]
  | [DenormalizeNullable<S>, boolean, true]
  | [DenormalizeNullable<S>, false, boolean] =>
  denormalize(input, schema, entities).slice(0, 3) as any;
