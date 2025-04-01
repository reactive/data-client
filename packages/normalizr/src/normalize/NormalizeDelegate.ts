import {
  EntityInterface,
  EntityTable,
  NormalizedIndex,
  INormalizeDelegate,
} from '../interface.js';
import { getCheckLoop } from './getCheckLoop.js';
import { INVALID } from '../denormalize/symbol.js';
import { BaseDelegate } from '../memo/Delegate.js';

export class NormalizeDelegate
  extends BaseDelegate
  implements INormalizeDelegate
{
  declare readonly entityMeta: {
    [entityKey: string]: {
      [pk: string]: {
        date: number;
        expiresAt: number;
        fetchedAt: number;
      };
    };
  };

  declare readonly meta: { fetchedAt: number; date: number; expiresAt: number };
  declare checkLoop: (entityKey: string, pk: string, input: object) => boolean;

  protected newEntities = new Map<string, Map<string, any>>();
  protected newIndexes = new Map<string, Map<string, any>>();

  constructor(
    {
      entities,
      indexes,
      entityMeta,
    }: {
      entities: EntityTable;
      indexes: NormalizedIndex;
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
  ) {
    super(entities, indexes);
    this.entityMeta = entityMeta;
    this.meta = actionMeta;
    this.checkLoop = getCheckLoop();
  }

  getInProgressEntity(key: string, pk: string) {
    // first time we come across this type of entity
    if (!this.newEntities.has(key)) {
      this.newEntities.set(key, new Map());
      // we will be editing these, so we need to clone them first
      this.entities[key] = {
        ...this.entities[key],
      };
      this.entityMeta[key] = {
        ...this.entityMeta[key],
      };
    }

    return (this.newEntities.get(key) as Map<string, any>).get(pk);
  }

  addEntity(
    schema: EntityInterface,
    pk: string,
    entity: any,
    meta?: { fetchedAt: number; date: number; expiresAt: number },
  ) {
    const key = schema.key;
    const newEntitiesKey = this.newEntities.get(key) as Map<string, any>;
    newEntitiesKey.set(pk, entity);

    // update index
    if (schema.indexes) {
      if (!this.newIndexes.has(key)) {
        this.newIndexes.set(key, new Map());
        this.indexes[key] = { ...this.indexes[key] };
      }
      handleIndexes(
        pk,
        schema.indexes,
        this.newIndexes.get(key) as Map<string, any>,
        this.indexes[key],
        entity,
        this.entities[key] as any,
      );
    }

    // set this after index updates so we know what indexes to remove from
    (this.entities[key] as any)[pk] = entity;

    if (meta) this.entityMeta[key][pk] = meta;
  }

  getMeta(key: string, pk: string) {
    return this.entityMeta[key][pk];
  }
}

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
