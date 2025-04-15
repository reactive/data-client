import { EntityInterface, EntityPath } from '../interface.js';
import { EntityCache } from './types.js';
import WeakDependencyMap from './WeakDependencyMap.js';

export type GetEntityCache = (
  pk: string,
  schema: EntityInterface,
) => WeakDependencyMap<EntityPath, object, any>;

export const getEntityCaches = (entityCache: EntityCache): GetEntityCache => {
  return (pk: string, schema: EntityInterface) => {
    const key = schema.key;
    // collections should use the entities they collect over
    // TODO: this should be based on a public interface
    const entityInstance: EntityInterface = (schema.cacheWith as any) ?? schema;

    if (!entityCache.has(key)) {
      entityCache.set(key, new Map());
    }
    const entityCacheKey = entityCache.get(key)!;

    if (!entityCacheKey.has(pk)) entityCacheKey.set(pk, new WeakMap());
    const entityCachePk = entityCacheKey.get(pk)!;

    let wem = entityCachePk.get(entityInstance);
    if (!wem) {
      wem = new WeakDependencyMap<EntityPath, object, any>();
      entityCachePk.set(entityInstance, wem);
    }

    return wem;
  };
};
