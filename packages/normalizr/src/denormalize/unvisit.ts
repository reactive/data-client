import type Cache from './cache.js';
import { INVALID } from './symbol.js';
import type { EntityInterface, UnvisitFunction } from '../interface.js';
import { isEntity } from '../isEntity.js';
import { denormalize as arrayDenormalize } from '../schemas/Array.js';
import { isImmutable } from '../schemas/ImmutableUtils.js';
import { denormalize as objectDenormalize } from '../schemas/Object.js';
import type { Path } from '../types.js';
import { type GetEntity } from '../WeakEntityMap.js';

function unvisitEntity(
  entityOrId: Record<string, any> | string,
  schema: EntityInterface,
  args: readonly any[],
  unvisit: UnvisitFunction,
  getEntity: GetEntity,
  cache: Cache,
): object | undefined | symbol {
  const entity =
    typeof entityOrId === 'object'
      ? entityOrId
      : getEntity({ key: schema.key, pk: entityOrId });
  if (typeof entity === 'symbol') {
    if (typeof schema.denormalizeOnly === 'function') {
      return schema.denormalizeOnly(entity, args, unvisit);
      // TODO(breaking): Change to this as breaking change once we only support newer entities
    } else if ((entity as symbol).toString().includes('DELETED')) {
      return INVALID;
    }
  }

  if (typeof entity !== 'object' || entity === null) {
    return entity as any;
  }

  const pk =
    // normalize must always place a string, because pk() return value is string | undefined
    // therefore no need to check for numbers
    typeof entityOrId === 'string'
      ? entityOrId
      : schema.pk(
          isImmutable(entity) ? (entity as any).toJS() : entity,
          undefined,
          undefined,
          args,
        );

  // if we can't generate a working pk we cannot do cache lookups properly,
  // so simply denormalize without caching
  if (pk === undefined || pk === '' || pk === 'undefined') {
    return noCacheGetEntity(localCacheKey =>
      unvisitEntityObject(entity, schema, unvisit, '', localCacheKey, args),
    );
  }

  // last function computes if it is not in any caches
  return cache.getEntity(pk, schema, entity, localCacheKey =>
    unvisitEntityObject(entity, schema, unvisit, pk, localCacheKey, args),
  );
}

function noCacheGetEntity(
  computeValue: (localCacheKey: Record<string, any>) => void,
): object | undefined | symbol {
  const localCacheKey = {};
  computeValue(localCacheKey);

  return localCacheKey[''];
}

function unvisitEntityObject(
  entity: object,
  schema: EntityInterface<any>,
  unvisit: UnvisitFunction,
  pk: string,
  localCacheKey: Record<string, any>,
  args: readonly any[],
): void {
  let entityCopy: any, _, deleted;
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
    localCacheKey[pk] = INVALID;
  } else {
    if (typeof schema.denormalizeOnly === 'function') {
      localCacheKey[pk] = schema.denormalizeOnly(entityCopy, args, unvisit);
    } else {
      [localCacheKey[pk], _, deleted] = (schema as any).denormalize(
        entityCopy,
        unvisit,
      );
      if (deleted) localCacheKey[pk] = INVALID;
    }
  }
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

const getUnvisit = (
  getEntity: GetEntity,
  cache: Cache,
  args: readonly any[],
) => {
  // TODO(breaking): This handles legacy schemas from 3.7 and below
  const unvisitAdapter = getUnvisitAdapter(unvisit);

  function unvisit(input: any, schema: any): any {
    if (!schema) return input;

    if (input === null) {
      return input;
    }

    const hasDenormalize =
      typeof schema.denormalize === 'function' ||
      typeof schema.denormalizeOnly === 'function';

    // deserialize fields (like Date)
    if (!hasDenormalize && typeof schema === 'function') {
      if (input instanceof schema) return input;
      if (input === undefined) return input;
      return new schema(input);
    }

    if (input === undefined) {
      // TODO(breaking): Drop support for initial All version
      const isAll = schema.constructor?.name === 'AllSchema';

      return isAll ? INVALID : undefined;
    }

    if (!hasDenormalize && typeof schema === 'object') {
      const method = Array.isArray(schema)
        ? arrayDenormalize
        : objectDenormalize;
      return method(schema, input, args, unvisit);
    }

    if (isEntity(schema)) {
      return unvisitEntity(
        input,
        schema,
        args,
        schema.denormalizeOnly ? unvisit : unvisitAdapter,
        getEntity,
        cache,
      );
    }

    if (hasDenormalize) {
      if (schema.denormalizeOnly) {
        return schema.denormalizeOnly(input, args, unvisit);
      } else {
        return denormalizeLegacySchema(schema, input, unvisitAdapter);
      }
    }

    return input;
  }

  return (input: any, schema: any): { data: any; paths: Path[] } => {
    // in the case where WeakMap cannot be used
    // this test ensures null is properly excluded from WeakMap
    const cachable = Object(input) === input && Object(schema) === schema;
    return cache.getResults(input, cachable, () => unvisit(input, schema));
  };
};
export default getUnvisit;

function denormalizeLegacySchema(
  schema: any,
  input: any,
  unvisitAdapter: (input: any, schema: any) => [any, boolean, boolean],
) {
  const [data, _, suspend] = schema.denormalize(input, unvisitAdapter);
  // TODO(breaking): Drop support for initial Query version
  // queryEndpoint schema only overrides 'denormalize' and 'infer'
  const isQuery =
    !Object.hasOwn(schema, 'normalize') &&
    Object.hasOwn(schema, 'denormalize') &&
    Object.hasOwn(schema, 'infer');
  return suspend && !isQuery ? INVALID : data;
}

// TODO(breaking): This handles legacy schemas from 3.7 and below
function getUnvisitAdapter(unvisit) {
  return function (input: any, schema: any): [any, boolean, boolean] {
    const isAll = schema?.constructor?.name === 'AllSchema';
    const value = unvisit(input, schema);

    // TODO(breaking): Drop support for initial All version
    if (isAll) {
      // we swap 'found' and 'suspend' because the initial Query version used 'found' to determine whether
      // it should 'process'
      return [
        typeof value === 'symbol' ? undefined : value,
        typeof value !== 'symbol',
        false,
      ];
    }
    return [
      typeof value === 'symbol' ? undefined : value,
      true,
      typeof value === 'symbol',
    ];
  };
}
