import type { Schema, EntityInterface, UnvisitFunction } from './interface.js';
import { isEntity } from './isEntity.js';
import { denormalize as arrayDenormalize } from './schemas/Array.js';
import { isImmutable } from './schemas/ImmutableUtils.js';
import { denormalize as objectDenormalize } from './schemas/Object.js';
import type {
  Denormalize,
  DenormalizeNullable,
  DenormalizeCache,
  Path,
} from './types.js';
import WeakEntityMap, {
  type Dep,
  getEntities,
  type GetEntity,
  depToPaths,
} from './WeakEntityMap.js';

interface EntityCacheValue {
  dependencies: Dep[];
  value: [any, boolean, boolean];
}
const unvisitEntity = (
  entityOrId: Record<string, any> | string,
  schema: EntityInterface,
  unvisit: UnvisitFunction,
  getEntity: GetEntity,
  getCache: ReturnType<typeof getEntityCaches>,
  localCache: Record<string, Record<string, any>>,
  cycleCache: Record<string, Record<string, number>>,
  dependencies: Dep[],
  cycleIndex: { i: number },
): [denormalized: object | undefined, found: boolean, deleted: boolean] => {
  const entity =
    typeof entityOrId === 'object'
      ? entityOrId
      : getEntity({ pk: entityOrId, key: schema.key });
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
  const localCacheKey = localCache[key];
  const cycleCacheKey = cycleCache[key];

  let found = true;
  let deleted = false;

  // local cache lookup first
  if (!localCacheKey[pk]) {
    const globalCache: WeakEntityMap<object, EntityCacheValue> = getCache(
      pk,
      schema,
    );
    const [cacheValue] = globalCache.get(entity, getEntity);
    // TODO: what if this just returned the deps - then we don't need to store them

    if (cacheValue) {
      localCacheKey[pk] = cacheValue.value[0];
      // TODO: can we store the cache values instead of tracking *all* their sources?
      // this is only used for setting results cache correctly. if we got this far we will def need to set as we would have already tried getting it
      dependencies.push(...cacheValue.dependencies);
      return cacheValue.value;
    }
    // if we don't find in denormalize cache then do full denormalize
    else {
      const trackingIndex = dependencies.length;
      dependencies.push({ entity, path: { key, pk } });

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

      // if in cycle, use the start of the cycle to track all deps
      // otherwise, we use our own trackingIndex
      const localKey = dependencies.slice(
        cycleIndex.i === -1 ? trackingIndex : cycleIndex.i,
      );
      const cacheValue: EntityCacheValue = {
        dependencies: localKey,
        value: [localCacheKey[pk], found, deleted],
      };
      globalCache.set(localKey, cacheValue);

      // start of cycle - reset cycle detection
      if (cycleIndex.i === trackingIndex) {
        cycleIndex.i = -1;
      }
    }
  } else {
    // cycle detected
    if (pk in cycleCacheKey) {
      cycleIndex.i = cycleCacheKey[pk];
    } else {
      // with no cycle, globalCacheEntry will have already been set
      dependencies.push({ entity, path: { key, pk } });
    }
  }

  return [localCacheKey[pk], found, deleted];
};

const getUnvisit = (
  entities: Record<string, Record<string, any>>,
  entityCache: DenormalizeCache['entities'],
  resultCache: DenormalizeCache['results'][string],
) => {
  const getEntity = getEntities(entities);
  const getCache = getEntityCaches(entityCache);
  const localCache: Record<string, Record<string, any>> = {};
  const dependencies: Dep[] = [];
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

    // deserialize fields (like Date)
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
        getCache,
        localCache,
        cycleCache,
        dependencies,
        cycleIndex,
      );
    }

    if (hasDenormalize) {
      return schema.denormalize(input, unvisit);
    }

    return [input, true, false];
  }

  return (
    input: any,
    schema: any,
  ): [
    denormalized: any,
    found: boolean,
    deleted: boolean,
    entityPaths: Path[],
  ] => {
    // in the case where WeakMap cannot be used
    // this test ensures null is properly excluded from WeakMap
    const cachable = Object(input) === input && Object(schema) === schema;
    if (!cachable) {
      const ret = unvisit(input, schema);
      // this is faster than spread
      // https://www.measurethat.net/Benchmarks/Show/23636/0/spread-with-tuples
      return [ret[0], ret[1], ret[2], depToPaths(dependencies)];
    }

    let [ret, entityPaths] = resultCache.get(input, getEntity);

    if (ret === undefined) {
      ret = unvisit(input, schema);
      // we want to do this before we add our 'input' entry
      entityPaths = depToPaths(dependencies);
      // for the first entry, `path` is ignored so empty members is fine
      dependencies.unshift({ entity: input, path: { key: '', pk: '' } });
      resultCache.set(dependencies, ret);
    }

    return [ret[0], ret[1], ret[2], entityPaths as Path[]];
  };
};

const getEntityCaches = (entityCache: DenormalizeCache['entities']) => {
  return (pk: string, schema: EntityInterface) => {
    const key = schema.key;

    if (!(key in entityCache)) {
      entityCache[key] = Object.create(null);
    }
    const entityCacheKey = entityCache[key];
    if (!entityCacheKey[pk])
      entityCacheKey[pk] = new WeakMap<
        EntityInterface,
        WeakEntityMap<object, any>
      >();

    let wem: WeakEntityMap<object, any> = entityCacheKey[pk].get(schema) as any;
    if (!wem) {
      wem = new WeakEntityMap<object, any>();
      entityCacheKey[pk].set(schema, wem);
    }

    return wem;
  };
};

type DenormalizeReturn<S extends Schema> =
  | [
      denormalized: Denormalize<S>,
      found: true,
      deleted: false,
      entityPaths: Path[],
    ]
  | [
      denormalized: DenormalizeNullable<S>,
      found: boolean,
      deleted: true,
      entityPaths: Path[],
    ]
  | [
      denormalized: DenormalizeNullable<S>,
      found: false,
      deleted: boolean,
      entityPaths: Path[],
    ];

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const denormalize = <S extends Schema>(
  input: unknown,
  schema: S | undefined,
  entities: any,
  entityCache: DenormalizeCache['entities'] = {},
  resultCache: DenormalizeCache['results'][string] = new WeakEntityMap(),
): DenormalizeReturn<S> => {
  // undefined mean don't do anything
  if (schema === undefined) {
    return [input, true, false, []] as [any, boolean, boolean, any];
  }
  if (input === undefined) {
    return [undefined, false, false, []] as [any, boolean, boolean, any];
  }
  return getUnvisit(entities, entityCache, resultCache)(input, schema);
};

export const denormalizeSimple = <S extends Schema>(
  input: any,
  schema: S | undefined,
  entities: any,
  entityCache?: DenormalizeCache['entities'],
  resultCache?: DenormalizeCache['results'][string],
):
  | [denormalized: Denormalize<S>, found: true, deleted: false]
  | [denormalized: DenormalizeNullable<S>, found: boolean, deleted: true]
  | [denormalized: DenormalizeNullable<S>, found: false, deleted: boolean] =>
  denormalize(input, schema, entities, entityCache, resultCache).slice(
    0,
    3,
  ) as any;

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
