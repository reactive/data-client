import { INVALID } from '../denormalize/symbol.js';
import type { EntityInterface } from '../interface.js';

export const addEntities =
  (
    newEntities: Record<string, any>,
    newIndexes: Record<string, any>,
    entitiesCopy: Record<string, any>,
    indexesCopy: Record<string, any>,
    entityMetaCopy: {
      [entityKey: string]: {
        [pk: string]: {
          date: number;
          expiresAt: number;
          fetchedAt: number;
        };
      };
    },
    actionMeta: { fetchedAt: number; date: number; expiresAt: number },
  ) =>
  (schema: EntityInterface, processedEntity: any, id: string) => {
    const schemaKey = schema.key;
    // first time we come across this type of entity
    if (!(schemaKey in newEntities)) {
      newEntities[schemaKey] = {};
      // we will be editing these, so we need to clone them first
      entitiesCopy[schemaKey] = { ...entitiesCopy[schemaKey] };
      entityMetaCopy[schemaKey] = { ...entityMetaCopy[schemaKey] };
    }

    const existingEntity = newEntities[schemaKey][id];
    if (existingEntity) {
      newEntities[schemaKey][id] = schema.merge(
        existingEntity,
        processedEntity,
      );
    } else {
      const inStoreEntity = entitiesCopy[schemaKey][id];
      let inStoreMeta: {
        date: number;
        expiresAt: number;
        fetchedAt: number;
      };
      // this case we already have this entity in store
      if (inStoreEntity && (inStoreMeta = entityMetaCopy[schemaKey][id])) {
        newEntities[schemaKey][id] = schema.mergeWithStore(
          inStoreMeta,
          actionMeta,
          inStoreEntity,
          processedEntity,
        );
        entityMetaCopy[schemaKey][id] = schema.mergeMetaWithStore(
          inStoreMeta,
          actionMeta,
          inStoreEntity,
          processedEntity,
        );
      } else {
        newEntities[schemaKey][id] = processedEntity;
        entityMetaCopy[schemaKey][id] = actionMeta;
      }
    }

    // update index
    if (schema.indexes) {
      if (!(schemaKey in newIndexes)) {
        newIndexes[schemaKey] = {};
        indexesCopy[schemaKey] = { ...indexesCopy[schemaKey] };
      }
      handleIndexes(
        id,
        schema.indexes,
        newIndexes[schemaKey],
        indexesCopy[schemaKey],
        newEntities[schemaKey][id],
        entitiesCopy[schemaKey],
      );
    }
    // set this after index updates so we know what indexes to remove from
    entitiesCopy[schemaKey][id] = newEntities[schemaKey][id];
  };

function handleIndexes(
  id: string,
  schemaIndexes: string[],
  indexes: Record<string, any>,
  storeIndexes: Record<string, any>,
  entity: any,
  storeEntities: Record<string, any>,
) {
  for (const index of schemaIndexes) {
    if (!(index in indexes)) {
      storeIndexes[index] = indexes[index] = {};
    }
    const indexMap = indexes[index];
    if (storeEntities[id]) {
      delete indexMap[storeEntities[id][index]];
    }
    // entity already in cache but the index changed
    if (
      storeEntities &&
      storeEntities[id] &&
      storeEntities[id][index] !== entity[index]
    ) {
      indexMap[storeEntities[id][index]] = INVALID;
    }
    if (index in entity) {
      indexMap[entity[index]] = id;
    } /* istanbul ignore next */ else if (
      process.env.NODE_ENV !== 'production'
    ) {
      console.warn(`Index not found in entity. Indexes must be top-level members of your entity.
Index: ${index}
Entity: ${JSON.stringify(entity, undefined, 2)}`);
    }
  }
}
