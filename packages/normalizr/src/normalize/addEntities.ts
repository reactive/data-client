import { INVALID } from '../denormalize/symbol.js';
import type { EntityInterface } from '../interface.js';

export const addEntities = (
  {
    entities,
    indexes,
    entityMeta,
  }: {
    entities: Record<string, any>;
    indexes: Record<string, any>;
    entityMeta: {
      [entityKey: string]: {
        [pk: string]: {
          date: number;
          expiresAt: number;
          fetchedAt: number;
        };
      };
    };
  },
  actionMeta: { fetchedAt: number; date: number; expiresAt: number },
) => {
  const newEntities = new Map<string, Map<string, any>>();
  const newIndexes = new Map<string, Map<string, any>>();
  return (schema: EntityInterface, processedEntity: any, id: string) => {
    const schemaKey = schema.key;
    // first time we come across this type of entity
    if (!newEntities.has(schemaKey)) {
      newEntities.set(schemaKey, new Map());
      // we will be editing these, so we need to clone them first
      entities[schemaKey] = { ...entities[schemaKey] };
      entityMeta[schemaKey] = { ...entityMeta[schemaKey] };
    }

    const newEntitiesKey = newEntities.get(schemaKey) as Map<string, any>;
    const existingEntity = newEntitiesKey.get(id);
    if (existingEntity) {
      newEntitiesKey.set(id, schema.merge(existingEntity, processedEntity));
    } else {
      const inStoreEntity = entities[schemaKey][id];
      let inStoreMeta: {
        date: number;
        expiresAt: number;
        fetchedAt: number;
      };
      // this case we already have this entity in store
      if (inStoreEntity && (inStoreMeta = entityMeta[schemaKey][id])) {
        newEntitiesKey.set(
          id,
          schema.mergeWithStore(
            inStoreMeta,
            actionMeta,
            inStoreEntity,
            processedEntity,
          ),
        );
        entityMeta[schemaKey][id] = schema.mergeMetaWithStore(
          inStoreMeta,
          actionMeta,
          inStoreEntity,
          processedEntity,
        );
      } else {
        newEntitiesKey.set(id, processedEntity);
        entityMeta[schemaKey][id] = actionMeta;
      }
    }

    // update index
    if (schema.indexes) {
      if (!newIndexes.has(schemaKey)) {
        newIndexes.set(schemaKey, new Map());
        indexes[schemaKey] = { ...indexes[schemaKey] };
      }
      handleIndexes(
        id,
        schema.indexes,
        newIndexes.get(schemaKey) as Map<string, any>,
        indexes[schemaKey],
        newEntitiesKey.get(id),
        entities[schemaKey],
      );
    }
    // set this after index updates so we know what indexes to remove from
    entities[schemaKey][id] = newEntitiesKey.get(id);
  };
};

function handleIndexes(
  id: string,
  schemaIndexes: string[],
  indexes: Map<string, any>,
  storeIndexes: Record<string, any>,
  entity: any,
  storeEntities: Record<string, any>,
) {
  for (const index of schemaIndexes) {
    if (!indexes.has(index)) {
      indexes.set(index, (storeIndexes[index] = {}));
    }
    const indexMap = indexes.get(index);
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
