import type Cache from './cache.js';
import { isEntity } from './isEntity.js';
import type { Path } from './types.js';
import { type GetEntity } from './WeakEntityMap.js';
import type {
  EntityInterface,
  UnvisitFunction,
} from '../../../../interface.js';
import { isImmutable } from '../../../ImmutableUtils.js';

const unvisitEntity = (
  entityOrId: Record<string, any> | string,
  schema: EntityInterface,
  unvisit: UnvisitFunction,
  getEntity: GetEntity,
  cache: Cache,
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

  // if we can't generate a working pk we cannot do cache lookups properly,
  // so simply denormalize without caching
  if (pk === undefined || pk === '' || pk === 'undefined') {
    return noCacheGetEntity(localCacheKey =>
      unvisitEntityObject(entity, schema, unvisit, '', localCacheKey),
    );
  }

  // last function computes if it is not in any caches
  return cache.getEntity(pk, schema, entity, localCacheKey =>
    unvisitEntityObject(entity, schema, unvisit, pk, localCacheKey),
  );
};

function noCacheGetEntity(
  computeValue: (localCacheKey: Record<string, any>) => [boolean, boolean],
): [denormalized: object | undefined, found: boolean, deleted: boolean] {
  const localCacheKey = {};
  const [found, deleted] = computeValue(localCacheKey);

  return [localCacheKey[''], found, deleted];
}

function unvisitEntityObject(
  entity: object,
  schema: EntityInterface<any>,
  unvisit: UnvisitFunction,
  pk: string,
  localCacheKey: Record<string, any>,
): [found: boolean, deleted: boolean] {
  let entityCopy: any, found, deleted;
  /* istanbul ignore else */
  if (schema.createIfValid) {
    entityCopy = localCacheKey[pk] = isImmutable(entity)
      ? schema.createIfValid(entity.toObject())
      : schema.createIfValid(entity);
    // TODO(breaking): remove once old verions no longer supported
  } /* istanbul ignore next */ else {
    entityCopy = entity;
    unvisit = withTrackedEntities(unvisit);
    unvisit.setLocal = entityCopy => (localCacheKey[pk] = entityCopy);
  }

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
  return [found, deleted];
}

// TODO(breaking): remove once unused
/* istanbul ignore next */
function withTrackedEntities(unvisit: UnvisitFunction): UnvisitFunction {
  // every time we nest, we want to unwrap back to the top.
  // this is due to only needed the next level of nested entities for lookup
  const originalUnvisit = unvisit.og || unvisit;
  const wrappedUnvisit = (input: any, schema: any) =>
    originalUnvisit(input, schema);
  wrappedUnvisit.og = unvisit;
  return wrappedUnvisit;
}

const getUnvisit = (getEntity: GetEntity, cache: Cache) => {
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
      throw new Error('we are not testing basic array or object schemas');
    }

    if (isEntity(schema)) {
      return unvisitEntity(input, schema, unvisit, getEntity, cache);
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
    return cache.getResults(input, cachable, () => unvisit(input, schema));
  };
};
export default getUnvisit;
it('[helper file in test folder]', () => {});
