import type Cache from './cache.js';
import { INVALID } from './symbol.js';
import { UNDEF } from './UNDEF.js';
import type {
  EntityInterface,
  EntityPath,
  IDenormalizeDelegate,
} from '../interface.js';
import { isEntity } from '../isEntity.js';
import type { DenormGetEntity } from '../memo/types.js';
import { denormalize as arrayDenormalize } from '../schemas/Array.js';
import { denormalize as objectDenormalize } from '../schemas/Object.js';

const getUnvisitEntity = (
  getEntity: DenormGetEntity,
  cache: Cache,
  delegate: IDenormalizeDelegate,
) => {
  return function unvisitEntity(
    schema: EntityInterface,
    entityOrId: Record<string, any> | string,
  ): object | undefined | typeof INVALID {
    const inputIsId = typeof entityOrId !== 'object';
    const entity =
      inputIsId ? getEntity({ key: schema.key, pk: entityOrId }) : entityOrId;
    if (typeof entity === 'symbol') {
      return schema.denormalize(entity, delegate);
    }

    if (
      entity === undefined &&
      inputIsId &&
      // entityOrId cannot be undefined literal as this function wouldn't be called in that case
      // however the blank strings can still occur
      entityOrId !== '' &&
      entityOrId !== 'undefined'
    ) {
      // we cannot perform WeakMap lookups with `undefined`, so we use a special object to represent undefined
      // we're actually using this call to ensure we update the cache if a nested schema changes from `undefined`
      // this is because cache.getEntity adds this key,pk as a dependency of anything it is nested under
      return cache.getEntity(entityOrId, schema, UNDEF, localCacheKey => {
        localCacheKey.set(entityOrId, undefined);
      });
    }

    if (typeof entity !== 'object' || entity === null) {
      return entity as any;
    }

    let pk: string | number | undefined =
      inputIsId ? entityOrId : (
        (schema.pk(entity, undefined, undefined, delegate.args) as any)
      );

    // if we can't generate a working pk we cannot do cache lookups properly,
    // so simply denormalize without caching
    if (pk === undefined || pk === '' || pk === 'undefined') {
      return noCacheGetEntity(localCacheKey =>
        unvisitEntityObject(schema, entity, '', localCacheKey, delegate),
      );
    }

    // just an optimization to make all cache usages of pk monomorphic
    if (typeof pk !== 'string') pk = `${pk}`;

    // last function computes if it is not in any caches
    return cache.getEntity(pk, schema, entity, localCacheKey =>
      unvisitEntityObject(schema, entity, pk, localCacheKey, delegate),
    );
  };
};

function unvisitEntityObject(
  schema: EntityInterface<any>,
  entity: object,
  pk: string,
  localCacheKey: Map<string, any>,
  delegate: IDenormalizeDelegate,
): void {
  const entityCopy = schema.createIfValid(entity);

  if (entityCopy === undefined) {
    // undefined indicates we should suspense (perhaps failed validation)
    localCacheKey.set(pk, INVALID);
  } else {
    // set before we recurse to prevent cycles causing infinite loops
    localCacheKey.set(pk, entityCopy);
    // we still need to set in case denormalize recursively finds INVALID
    localCacheKey.set(pk, schema.denormalize(entityCopy, delegate));
  }
}

function noCacheGetEntity(
  computeValue: (localCacheKey: Map<string, any>) => void,
): object | undefined | typeof INVALID {
  const localCacheKey = new Map<string, any>();
  computeValue(localCacheKey);

  return localCacheKey.get('');
}

const MAX_ENTITY_DEPTH = 64;

const getUnvisit = (
  getEntity: DenormGetEntity,
  cache: Cache,
  args: readonly any[],
) => {
  let depth = 0;
  let depthLimitHit = false;
  // Single delegate object reused for the whole denormalize tree. Recursive
  // schemas call `delegate.unvisit(...)` for nested types and
  // `delegate.argsKey(fn)` to register an args-derived cache dimension.
  const delegate: IDenormalizeDelegate = {
    args,
    unvisit,
    argsKey: fn => cache.argsKey(fn),
  };
  // we don't inline this as making this function too big inhibits v8's JIT
  const unvisitEntity = getUnvisitEntity(getEntity, cache, delegate);
  function unvisit(schema: any, input: any): any {
    if (!schema) return input;

    if (input === null || input === undefined) {
      return input;
    }

    if (typeof schema.denormalize !== 'function') {
      // deserialize fields (like Temporal.Instant)
      if (typeof schema === 'function') {
        return schema(input);
      }

      // shorthand for object, array
      if (typeof schema === 'object') {
        const method =
          Array.isArray(schema) ? arrayDenormalize : objectDenormalize;
        return method(schema, input, delegate);
      }
    } else {
      if (isEntity(schema)) {
        if (depth >= (schema.maxEntityDepth ?? MAX_ENTITY_DEPTH)) {
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !depthLimitHit) {
            depthLimitHit = true;
            const limit = schema.maxEntityDepth ?? MAX_ENTITY_DEPTH;
            console.error(
              `Entity depth limit of ${limit} reached for "${schema.key}" entity. ` +
                `This usually means your schema has very deep or wide bidirectional relationships. ` +
                `Nested entities beyond this depth are returned with unresolved ids. ` +
                `Consider using Lazy for recursive schemas to avoid depth limits with better performance: https://dataclient.io/rest/api/Lazy` +
                (schema.maxEntityDepth === undefined ?
                  ` Alternatively, set static maxEntityDepth on your Entity to configure this limit.`
                : ''),
            );
          }
          return depthLimitEntity(getEntity, schema, input);
        }
        depth++;
        const result = unvisitEntity(schema, input);
        depth--;
        return result;
      } else if (
        typeof (schema as any).createIfValid === 'function' &&
        typeof input === 'string'
      ) {
        // Fast path for string inputs to table-resident schemas without `pk`
        // (e.g. Scalar): look up via `unvisitEntity` directly, bypassing
        // `schema.denormalize`. Their pre-computed id bakes args-dependent info
        // (Scalar: lens) into the pk, so the WDM keyed by (schema.key, pk, schema)
        // segregates naturally — no `argsKey` layer needed. Discriminator is
        // `createIfValid` (Invalidate has only `key` and falls through).
        return unvisitEntity(schema as any, input);
      }

      return schema.denormalize(input, delegate);
    }

    return input;
  }

  return (schema: any, input: any): { data: any; paths: EntityPath[] } => {
    // in the case where WeakMap cannot be used
    // this test ensures null is properly excluded from WeakMap
    const cachable = Object(input) === input && Object(schema) === schema;
    return cache.getResults(input, cachable, () => unvisit(schema, input));
  };
};
export default getUnvisit;

/** At depth limit: return entity without resolving nested schema fields */
function depthLimitEntity(
  getEntity: DenormGetEntity,
  schema: EntityInterface,
  input: any,
): object | undefined | typeof INVALID {
  const entity =
    typeof input !== 'object' ?
      getEntity({ key: schema.key, pk: input })
    : input;
  if (typeof entity !== 'object' || entity === null) return entity as any;
  return schema.createIfValid(entity) ?? INVALID;
}
