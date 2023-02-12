import type { Schema, EntityInterface, UnvisitFunction } from './interface.js';
import { isEntity } from './isEntity.js';
import { denormalize as arrayDenormalize } from './schemas/Array.js';
import { isImmutable } from './schemas/ImmutableUtils.js';
import { denormalize as objectDenormalize } from './schemas/Object.js';
import type {
  Denormalize,
  DenormalizeNullable,
  DenormalizeCache,
} from './types.js';
import WeakListMap from './WeakListMap.js';

const unvisitEntity = (
  entityOrId: Record<string, any> | string,
  schema: EntityInterface,
  unvisit: UnvisitFunction,
  getEntity: (
    entityOrId: Record<string, any> | string,
    schema: EntityInterface,
  ) => object | symbol,
  localCache: Record<string, Record<string, any>>,
  cycleCache: Record<string, Record<string, number>>,
  entityCache: DenormalizeCache['entities'],
  dependencies: object[],
  cycleIndex: { i: number },
): [denormalized: object | undefined, found: boolean, deleted: boolean] => {
  const entity = getEntity(entityOrId, schema);
  if (
    typeof entity === 'symbol' &&
    (entity as symbol).toString().includes('DELETED')
  ) {
    return [undefined, true, true];
    // TODO: Change to this as breaking change once we only support newer entities
    // also remove `(entity as symbol).toString().includes('DELETED')` and do this for all symbols
    // return schema.denormalize(entity, unvisit);
  }

  if (typeof entity !== 'object' || entity === null) {
    return [entity as any, false, false];
  }

  const pk =
    // normalize must always place a string, because pk() return value is string | undefined
    // therefore no need to check for numbers
    typeof entityOrId === 'string'
      ? entityOrId
      : schema.pk(isImmutable(entity) ? (entity as any).toJS() : entity);
  // if we can't generate a working pk; this is hopeless so let's give them what's already there
  // otherwise, even when we aren't doing a lookup we want to turn the entityOrId object into the
  // expected class, and cache that class for referential equality. PK is used for global equality lookup.
  if (pk === undefined || pk === '' || pk === 'undefined') {
    return [entity, false, false];
  }

  const key = schema.key;
  if (!(key in localCache)) {
    localCache[key] = Object.create(null);
  }
  if (!(key in cycleCache)) {
    cycleCache[key] = Object.create(null);
  }
  if (!(key in entityCache)) {
    entityCache[key] = Object.create(null);
  }
  const localCacheKey = localCache[key];
  const cycleCacheKey = cycleCache[key];
  const entityCacheKey = entityCache[key];

  let found = true;
  let deleted = false;

  if (!localCacheKey[pk]) {
    const trackingIndex = dependencies.length;
    dependencies.push(entity);

    let entityCopy: any;
    if (schema.createIfValid) {
      entityCopy = localCacheKey[pk] = isImmutable(entity)
        ? schema.createIfValid(entity.toObject())
        : schema.createIfValid(entity);
      // TODO(breaking): remove once old verions no longer supported
    } else {
      entityCopy = entity;
      unvisit = withTrackedEntities(unvisit);
      unvisit.setLocal = entityCopy => (localCacheKey[pk] = entityCopy);
    }

    cycleCacheKey[pk] = trackingIndex;
    if (entityCopy === undefined) {
      // undefined indicates we should suspense (perhaps failed validation)
      found = false;
      deleted = true;
    } else {
      [localCacheKey[pk], found, deleted] = schema.denormalize(
        entityCopy,
        unvisit,
      );
    }
    delete cycleCacheKey[pk];

    const globalCacheEntry = getGlobalCacheEntry(entityCacheKey, pk);

    // if in cycle, use the start of the cycle to track all deps
    // otherwise, we use our own trackingIndex
    const localKey = dependencies.slice(
      cycleIndex.i === -1 ? trackingIndex : cycleIndex.i,
    );

    if (!globalCacheEntry.has(localKey)) {
      globalCacheEntry.set(localKey, localCacheKey[pk]);
    } else {
      localCacheKey[pk] = globalCacheEntry.get(localKey);
    }

    // start of cycle - reset cycle detection
    if (cycleIndex.i === trackingIndex) {
      cycleIndex.i = -1;
    }
  } else {
    // cycle detected
    if (pk in cycleCacheKey) {
      cycleIndex.i = cycleCacheKey[pk];
    } else {
      // with no cycle, globalCacheEntry will have already been set
      dependencies.push(entity);
    }
  }

  return [localCacheKey[pk], found, deleted];
};

const getUnvisit = (
  entities: Record<string, Record<string, any>>,
  entityCache: DenormalizeCache['entities'],
  resultCache: WeakListMap<object, any>,
  localCache: Record<string, Record<string, any>>,
) => {
  const getEntity = getEntities(entities);
  const dependencies: object[] = [];
  const cycleIndex = { i: -1 };
  const cycleCache = {};

  function unvisit(
    input: any,
    schema: any,
  ): [denormalized: any, found: boolean, deleted: boolean] {
    if (!schema) return [input, true, false];

    // null is considered intentional, thus always 'found' as true
    if (input === null) {
      return [input, true, false];
    }

    const hasDenormalize = typeof schema.denormalize === 'function';

    if (!hasDenormalize && typeof schema === 'function') {
      if (input instanceof schema) return [input, true, false];
      // field deserialization should never count against 'found' (whether to used inferred results)
      if (input === undefined) return [input, true, false];
      return [new schema(input), true, false];
    }

    if (input === undefined) {
      return [input, false, false];
    }

    if (!hasDenormalize && typeof schema === 'object') {
      const method = Array.isArray(schema)
        ? arrayDenormalize
        : objectDenormalize;
      return method(schema, input, unvisit);
    }

    if (isEntity(schema)) {
      return unvisitEntity(
        input,
        schema,
        unvisit,
        getEntity,
        localCache,
        cycleCache,
        entityCache,
        dependencies,
        cycleIndex,
      );
    }

    if (hasDenormalize) {
      return schema.denormalize(input, unvisit);
    }

    return [input, true, false];
  }

  //const wrappedUnvisit = withTrackedEntities(unvisit, globalKey);

  return (
    input: any,
    schema: any,
  ): [denormalized: any, found: boolean, deleted: boolean] => {
    const ret = unvisit(input, schema);
    // in the case where WeakMap cannot be used
    // this test ensures null is properly excluded from WeakMap
    if (Object(input) !== input) return ret;

    dependencies.push(input);
    if (!resultCache.has(dependencies)) {
      resultCache.set(dependencies, ret[0]);
      return ret;
    } else {
      return [resultCache.get(dependencies), ret[1], ret[2]];
    }
  };
};

const getEntities = (entities: Record<string, any>) => {
  const entityIsImmutable = isImmutable(entities);

  return (
    entityOrId: Record<string, any> | string,
    schema: EntityInterface,
  ) => {
    const schemaKey = schema.key;

    if (typeof entityOrId === 'object') {
      return entityOrId;
    }

    if (entityIsImmutable) {
      return entities.getIn([schemaKey, entityOrId]);
    }

    return entities[schemaKey]?.[entityOrId];
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

function getGlobalCacheEntry(
  entityCache: { [pk: string]: WeakListMap<object, EntityInterface<any>> },

  id: any,
) {
  if (!entityCache[id]) entityCache[id] = new WeakListMap();
  return entityCache[id];
}

// TODO(breaking): remove once unused
function withTrackedEntities(unvisit: UnvisitFunction): UnvisitFunction {
  // every time we nest, we want to unwrap back to the top.
  // this is due to only needed the next level of nested entities for lookup
  const originalUnvisit = unvisit.og || unvisit;
  const wrappedUnvisit = (input: any, schema: any) =>
    originalUnvisit(input, schema);
  wrappedUnvisit.og = unvisit;
  return wrappedUnvisit;
}
