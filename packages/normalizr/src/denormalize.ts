import { isImmutable } from './schemas/ImmutableUtils';
import { denormalize as arrayDenormalize } from './schemas/Array';
import { denormalize as objectDenormalize } from './schemas/Object';
import {
  Denormalize,
  DenormalizeNullable,
  Schema,
  DenormalizeCache,
  UnvisitFunction,
} from './types';
import Entity, { isEntity } from './entities/Entity';
import { DELETED } from './special';
import { EntityInterface } from './schema';
import WeakListMap from './WeakListMap';

const unvisitEntity = (
  id: any,
  schema: any,
  unvisit: UnvisitFunction,
  getEntity: (
    entityOrId: Record<string, any> | string,
    schema: typeof Entity,
  ) => EntityInterface | typeof DELETED,
  localCache: Record<string, Record<string, any>>,
  entityCache: DenormalizeCache['entities'],
): [
  denormalized: EntityInterface | undefined,
  found: boolean,
  deleted: boolean,
] => {
  const entity = getEntity(id, schema);
  if (entity === DELETED) {
    return [undefined, true, true];
  }
  if (typeof entity !== 'object' || entity === null) {
    return [entity, false, false];
  }

  if (localCache[schema.key] === undefined) {
    localCache[schema.key] = {};
  }

  let found = true;
  let deleted = false;
  if (!localCache[schema.key][id]) {
    const globalKey: EntityInterface[] = [entity];
    const wrappedUnvisit = withTrackedEntities(unvisit, globalKey);

    if (!entityCache[schema.key]) entityCache[schema.key] = {};
    if (!entityCache[schema.key][id])
      entityCache[schema.key][id] = new WeakListMap();
    const globalCacheEntry = entityCache[schema.key][id];

    const entityCopy = isImmutable(entity) ? entity : schema.fromJS(entity);
    // Need to set this first so that if it is referenced further within the
    // denormalization the reference will already exist.
    localCache[schema.key][id] = entityCopy;
    [localCache[schema.key][id], found, deleted] = schema.denormalize(
      entityCopy,
      wrappedUnvisit,
    );

    if (!globalCacheEntry.has(globalKey)) {
      globalCacheEntry.set(globalKey, localCache[schema.key][id]);
    } else {
      // localCache is only used before this point for recursive relationships
      // since recursive relationships must all referentially change if *any* do, we either
      // get the correct one here, or will never find the same version in the cache
      localCache[schema.key][id] = globalCacheEntry.get(globalKey);
    }
  }
  return [localCache[schema.key][id], found, deleted];
};

const getUnvisit = (
  entities: Record<string, Record<string, any>>,
  entityCache: DenormalizeCache['entities'],
  resultCache: WeakListMap<object, any>,
  localCache: Record<string, Record<string, any>>,
) => {
  const getEntity = getEntities(entities);

  function unvisit(
    input: any,
    schema: any,
  ): [denormalized: any, found: boolean, deleted: boolean] {
    if (!schema) return [input, true, false];

    if (!schema.denormalize || typeof schema.denormalize !== 'function') {
      if (typeof schema === 'function') {
        if (input instanceof schema) return [input, true, false];
        return [new schema(input), true, false];
      } else if (typeof schema === 'object') {
        const method = Array.isArray(schema)
          ? arrayDenormalize
          : objectDenormalize;
        return method(schema, input, wrappedUnvisit);
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
      return unvisitEntity(
        input,
        schema,
        wrappedUnvisit,
        getEntity,
        localCache,
        entityCache,
      );
    }

    if (typeof schema.denormalize === 'function') {
      return schema.denormalize(input, wrappedUnvisit);
    }

    return [input, true, false];
  }

  const globalKey: EntityInterface[] = [];
  const wrappedUnvisit = withTrackedEntities(unvisit, globalKey);

  return (
    input: any,
    schema: any,
  ): [denormalized: any, found: boolean, deleted: boolean] => {
    globalKey.push(input);
    const ret = unvisit(input, schema);
    // in the case where WeakMap cannot be used
    // this test ensures null is properly excluded from WeakMap
    if (Object(input) !== input) return ret;

    if (!resultCache.has(globalKey)) {
      resultCache.set(globalKey, ret[0]);
      return ret;
    } else {
      return [resultCache.get(globalKey), ret[1], ret[2]];
    }
  };
};

const getEntities = (entities: Record<string, any>) => {
  const entityIsImmutable = isImmutable(entities);

  return (entityOrId: Record<string, any> | string, schema: typeof Entity) => {
    const schemaKey = schema.key;

    if (typeof entityOrId === 'object') {
      return entityOrId;
    }

    if (entityIsImmutable) {
      return entities.getIn([schemaKey, entityOrId]);
    }

    return entities[schemaKey] && entities[schemaKey][entityOrId];
  };
};

type DenormalizeReturn<S extends Schema> =
  | [
      denormalized: Denormalize<S>,
      found: true,
      deleted: false,
      resolvedEntities: Record<string, Record<string, any>>,
    ]
  | [
      denormalized: DenormalizeNullable<S>,
      found: boolean,
      deleted: true,
      resolvedEntities: Record<string, Record<string, any>>,
    ]
  | [
      denormalized: DenormalizeNullable<S>,
      found: false,
      deleted: boolean,
      resolvedEntities: Record<string, Record<string, any>>,
    ];

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const denormalize = <S extends Schema>(
  input: unknown,
  schema: S | undefined,
  entities: any,
  entityCache: DenormalizeCache['entities'] = {},
  resultCache: WeakListMap<object, any> = new WeakListMap(),
): DenormalizeReturn<S> => {
  // undefined mean don't do anything
  if (schema === undefined) {
    return [input, true, false, {}] as [any, boolean, boolean, any];
  }
  if (input === undefined) {
    return [undefined, false, false, {}] as [any, boolean, boolean, any];
  }
  const resolvedEntities: Record<string, Record<string, any>> = {};
  const unvisit = getUnvisit(
    entities,
    entityCache,
    resultCache,
    resolvedEntities,
  );
  return [...unvisit(input, schema), resolvedEntities] as [
    any,
    boolean,
    boolean,
    any,
  ];
};

export const denormalizeSimple = <S extends Schema>(
  input: any,
  schema: S | undefined,
  entities: any,
  entityCache: DenormalizeCache['entities'] = {},
  resultCache: WeakListMap<object, any> = new WeakListMap(),
):
  | [denormalized: Denormalize<S>, found: true, deleted: false]
  | [denormalized: DenormalizeNullable<S>, found: boolean, deleted: true]
  | [denormalized: DenormalizeNullable<S>, found: false, deleted: boolean] =>
  denormalize(input, schema, entities, entityCache, resultCache).slice(
    0,
    3,
  ) as any;

function withTrackedEntities(
  unvisit: UnvisitFunction,
  globalKey: EntityInterface<any>[],
) {
  // every time we nest, we want to unwrap back to the top.
  // this is due to only needed the next level of nested entities for lookup
  const originalUnvisit = unvisit.og || unvisit;
  const wrappedUnvisit = (input: any, schema: any) => {
    const ret: [any, boolean, boolean] = originalUnvisit(input, schema);
    // pass over undefined in key
    if (ret[0] && schema && isEntity(schema)) {
      /* istanbul ignore else */
      if (Object(ret[0]) === ret[0]) {
        globalKey.push(ret[0]);
      } else if (process.env.NODE_ENV !== 'production') {
        throw new Error(
          `Unexpected primitive found during denormalization\nFound: ${ret[0]}\nExpected entity: ${schema}`,
        );
      }
    }

    return ret;
  };
  wrappedUnvisit.og = unvisit;
  return wrappedUnvisit;
}
