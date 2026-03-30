import type Cache from './cache.js';
import { INVALID } from './symbol.js';
import { UNDEF } from './UNDEF.js';
import type { EntityInterface, EntityPath } from '../interface.js';
import { isEntity } from '../isEntity.js';
import type { DenormGetEntity } from '../memo/types.js';
import { denormalize as arrayDenormalize } from '../schemas/Array.js';
import { denormalize as objectDenormalize } from '../schemas/Object.js';

const getUnvisitEntity = (
  getEntity: DenormGetEntity,
  cache: Cache,
  args: readonly any[],
  unvisit: (schema: any, input: any) => any,
) => {
  return function unvisitEntity(
    schema: EntityInterface,
    entityOrId: Record<string, any> | string,
  ): object | undefined | typeof INVALID {
    const inputIsId = typeof entityOrId !== 'object';
    const entity =
      inputIsId ? getEntity({ key: schema.key, pk: entityOrId }) : entityOrId;
    if (typeof entity === 'symbol') {
      return schema.denormalize(entity, args, unvisit);
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
        (schema.pk(entity, undefined, undefined, args) as any)
      );

    // if we can't generate a working pk we cannot do cache lookups properly,
    // so simply denormalize without caching
    if (pk === undefined || pk === '' || pk === 'undefined') {
      return noCacheGetEntity(localCacheKey =>
        unvisitEntityObject(schema, entity, '', localCacheKey, args, unvisit),
      );
    }

    // just an optimization to make all cache usages of pk monomorphic
    if (typeof pk !== 'string') pk = `${pk}`;

    // last function computes if it is not in any caches
    return cache.getEntity(pk, schema, entity, localCacheKey =>
      unvisitEntityObject(schema, entity, pk, localCacheKey, args, unvisit),
    );
  };
};

function unvisitEntityObject(
  schema: EntityInterface<any>,
  entity: object,
  pk: string,
  localCacheKey: Map<string, any>,
  args: readonly any[],
  unvisit: (schema: any, input: any) => any,
): void {
  const entityCopy = schema.createIfValid(entity);

  if (entityCopy === undefined) {
    // undefined indicates we should suspense (perhaps failed validation)
    localCacheKey.set(pk, INVALID);
  } else {
    // set before we recurse to prevent cycles causing infinite loops
    localCacheKey.set(pk, entityCopy);
    // we still need to set in case denormalize recursively finds INVALID
    localCacheKey.set(pk, schema.denormalize(entityCopy, args, unvisit));
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
  let fieldDepthBase: number | undefined;
  let fieldDepthLimit: number | undefined;
  let cycleAncestors: Set<string> | undefined;

  // we don't inline this as making this function too big inhibits v8's JIT
  const unvisitEntity = getUnvisitEntity(getEntity, cache, args, unvisit);
  function unvisit(
    schema: any,
    input: any,
    fieldConfig?: { entityDepth?: number; detectCycles?: boolean },
  ): any {
    if (!schema) return input;

    if (input === null || input === undefined) {
      return input;
    }

    // Per-field config: save previous state, set new limits, recurse, restore
    // detectCycles: only create ancestor set if not already active
    // entityDepth: only set if not already active (designed for self-referential
    // fields on the same entity; see limitation note in PR description)
    if (fieldConfig !== undefined) {
      const prevLimit = fieldDepthLimit;
      const prevBase = fieldDepthBase;
      const prevCycleAncestors = cycleAncestors;

      if (fieldConfig.entityDepth !== undefined && fieldDepthLimit === undefined) {
        fieldDepthBase = depth;
        fieldDepthLimit = fieldConfig.entityDepth;
      }
      if (fieldConfig.detectCycles && cycleAncestors === undefined) {
        cycleAncestors = new Set<string>();
      }

      const result = unvisit(schema, input);
      fieldDepthLimit = prevLimit;
      fieldDepthBase = prevBase;
      cycleAncestors = prevCycleAncestors;
      return result;
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
        return method(schema, input, args, unvisit);
      }
    } else {
      if (isEntity(schema)) {
        // Per-field cycle detection: same entity type already in ancestor path
        if (cycleAncestors !== undefined && cycleAncestors.has(schema.key)) {
          return depthLimitEntity(getEntity, cache, schema, input, args);
        }
        // Per-field entityDepth limit
        if (
          fieldDepthLimit !== undefined &&
          depth - fieldDepthBase! >= fieldDepthLimit
        ) {
          return depthLimitEntity(getEntity, cache, schema, input, args);
        }
        // Global safety net
        if (depth >= MAX_ENTITY_DEPTH) {
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !depthLimitHit) {
            depthLimitHit = true;
            console.error(
              `Entity depth limit of ${MAX_ENTITY_DEPTH} reached for "${schema.key}" entity. ` +
                `This usually means your schema has very deep or wide bidirectional relationships. ` +
                `Nested entities beyond this depth are returned with unresolved ids. ` +
                `Consider using { detectCycles: true } on bidirectional schema fields or { entityDepth: N } on self-referential fields.`,
            );
          }
          return depthLimitEntity(getEntity, cache, schema, input, args);
        }

        // Track ancestor type for cycle detection
        const addedToAncestors =
          cycleAncestors !== undefined && !cycleAncestors.has(schema.key);
        if (addedToAncestors) cycleAncestors!.add(schema.key);

        depth++;
        const result = unvisitEntity(schema, input);
        depth--;

        if (addedToAncestors) cycleAncestors!.delete(schema.key);
        return result;
      }

      return schema.denormalize(input, args, unvisit);
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

/** At depth limit: return cached entity if available, otherwise create shallow copy without caching.
 * Reads from cache to reuse fully resolved versions, but never writes depth-limited
 * copies to cache — prevents poisoning the cache with shallow versions. */
function depthLimitEntity(
  getEntity: DenormGetEntity,
  cache: Cache,
  schema: EntityInterface,
  input: any,
  args: readonly any[],
): object | undefined | typeof INVALID {
  const inputIsId = typeof input !== 'object';
  const entity = inputIsId ? getEntity({ key: schema.key, pk: input }) : input;
  if (typeof entity !== 'object' || entity === null) return entity as any;

  let pk: string | number | undefined =
    inputIsId ? input : (schema.pk(entity, undefined, undefined, args) as any);
  if (pk !== undefined && pk !== '' && pk !== 'undefined') {
    if (typeof pk !== 'string') pk = `${pk}`;
    // Check cache for a previously fully resolved version
    const cached = cache.getEntity(pk, schema, entity, () => {});
    if (cached !== undefined) return cached;
  }

  // No cached version — create a shallow copy without caching it
  return schema.createIfValid(entity) ?? INVALID;
}
