import type { Schema, EntityInterface, UnvisitFunction } from './interface.js';
import type {
  Denormalize,
  DenormalizeNullable,
  DenormalizeCache,
} from './types.js';
import { isEntity } from './isEntity.js';
import WeakListMap from './WeakListMap.js';
import { denormalize as arrayDenormalize } from './schemas/Array.js';
import { denormalize as objectDenormalize } from './schemas/Object.js';
import { isImmutable } from './schemas/ImmutableUtils.js';

const DRAFT = Symbol('draft');

const unvisitEntity = (
  entityOrId: Record<string, any> | string,
  schema: EntityInterface,
  unvisit: UnvisitFunction,
  getEntity: (
    entityOrId: Record<string, any> | string,
    schema: EntityInterface,
  ) => object | symbol,
  localCache: Record<string, Record<string, any>>,
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
    typeof entityOrId === 'string'
      ? entityOrId
      : schema.pk(isImmutable(entity) ? (entity as any).toJS() : entity);
  if (pk === undefined || pk === '') {
    return [entity, false, false];
  }

  if (localCache[schema.key] === undefined) {
    localCache[schema.key] = Object.create(null);
  }

  let found = true;
  let deleted = false;

  if (!localCache[schema.key][pk]) {
    const trackingIndex = dependencies.length;
    dependencies.push(entity);

    const wrappedUnvisit = withTrackedEntities(unvisit);
    // { [DRAFT] } means we are still processing - which if found indicates a cycle
    wrappedUnvisit.setLocal = entityCopy =>
      (localCache[schema.key][pk] = { [DRAFT]: entityCopy, i: trackingIndex });

    const globalCacheEntry = getGlobalCacheEntry(entityCache, schema, pk);

    [localCache[schema.key][pk], found, deleted] = schema.denormalize(
      entity,
      wrappedUnvisit,
    );

    // if in cycle, use the start of the cycle to track all deps
    // otherwise, we use our own trackingIndex
    const localKey = dependencies.slice(
      cycleIndex.i === -1 ? trackingIndex : cycleIndex.i,
    );

    if (!globalCacheEntry.has(localKey)) {
      globalCacheEntry.set(localKey, localCache[schema.key][pk]);
    } else {
      localCache[schema.key][pk] = globalCacheEntry.get(localKey);
    }

    // start of cycle - reset cycle detection
    if (cycleIndex.i === trackingIndex) {
      cycleIndex.i = -1;
    }
  } else {
    // cycle detected
    if (Object.hasOwn(localCache[schema.key][pk], DRAFT)) {
      cycleIndex.i = localCache[schema.key][pk].i;
      return [localCache[schema.key][pk][DRAFT], found, deleted];
    } else {
      // with no cycle, globalCacheEntry will have already been set
      dependencies.push(entity);
    }
  }

  return [localCache[schema.key][pk], found, deleted];
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
  entityCache: {
    [key: string]: { [pk: string]: WeakListMap<object, EntityInterface<any>> };
  },
  schema: any,
  id: any,
) {
  if (!entityCache[schema.key]) entityCache[schema.key] = {};
  if (!entityCache[schema.key][id])
    entityCache[schema.key][id] = new WeakListMap();
  return entityCache[schema.key][id];
}

function withTrackedEntities(unvisit: UnvisitFunction): UnvisitFunction {
  // every time we nest, we want to unwrap back to the top.
  // this is due to only needed the next level of nested entities for lookup
  const originalUnvisit = unvisit.og || unvisit;
  const wrappedUnvisit = (input: any, schema: any) =>
    originalUnvisit(input, schema);
  wrappedUnvisit.og = unvisit;
  return wrappedUnvisit;
}
