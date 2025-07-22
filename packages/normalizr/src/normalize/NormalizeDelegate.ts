import type {
  EntityTable,
  NormalizedIndex,
  INormalizeDelegate,
  Mergeable,
} from '../interface.js';
import { getCheckLoop } from './getCheckLoop.js';
import { POJODelegate } from '../delegate/Delegate.js';
import { INVALID } from '../denormalize/symbol.js';
import type { NormalizedSchema } from '../types.js';

/** Full normalize() logic for POJO state */
export class NormalizeDelegate
  extends POJODelegate
  implements INormalizeDelegate
{
  declare readonly result: Normalized;
  // declare result: any;
  // declare readonly entities: EntityTable;
  // declare readonly indexes: {
  //   [entityKey: string]: {
  //     [indexName: string]: { [lookup: string]: string };
  //   };
  // };

  // declare readonly entitiesMeta: {
  //   [entityKey: string]: {
  //     [pk: string]: {
  //       date: number;
  //       expiresAt: number;
  //       fetchedAt: number;
  //     };
  //   };
  // };

  declare readonly meta: { fetchedAt: number; date: number; expiresAt: number };
  declare checkLoop: (entityKey: string, pk: string, input: object) => boolean;

  // protected new = {
  //   entities: new Map<string, Map<string, any>>(),
  //   indexes: new Map<string, Map<string, any>>(),
  // };

  constructor(
    state: {
      entities: EntityTable;
      indexes: NormalizedIndex;
      entitiesMeta: {
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
    super(state);
    this.result = new Normalized(state);
    this.meta = actionMeta;
    this.checkLoop = getCheckLoop();
  }

  /** Updates an entity using merge lifecycles when it has previously been set */
  mergeEntity(
    schema: Mergeable & { indexes?: any },
    pk: string,
    incomingEntity: any,
  ) {
    const key = schema.key;

    // default when this is completely new entity
    let nextEntity = incomingEntity;
    let nextMeta = this.meta;

    // if we already processed this entity during this normalization (in another nested place)
    let entity = this.result.getEntity(key, pk);
    if (entity) {
      nextEntity = schema.merge(entity, incomingEntity);
    } else {
      // if we find it in the store
      entity = this.getEntity(key, pk);
      if (entity) {
        const meta = this.getMeta(key, pk);
        nextEntity = schema.mergeWithStore(
          meta,
          nextMeta,
          entity,
          incomingEntity,
        );
        nextMeta = schema.mergeMetaWithStore(
          meta,
          nextMeta,
          entity,
          incomingEntity,
        );
      }
    }

    // once we have computed the merged values, set them
    this.setEntity(schema, pk, nextEntity, nextMeta);
  }

  /** Sets an entity overwriting any previously set values */
  setEntity(
    schema: { key: string; indexes?: any },
    pk: string,
    entity: any,
    meta: { fetchedAt: number; date: number; expiresAt: number } = this.meta,
  ) {
    const key = schema.key;
    const newEntities = this.result.getEntities(key);
    const updateMeta = !newEntities.has(pk);
    newEntities.set(pk, entity);

    // update index
    if (schema.indexes) {
      handleIndexes(
        pk,
        schema.indexes,
        this.result.getIndexes(key),
        this.clone.indexes[key],
        entity,
        this.clone.entities[key] as any,
      );
    }

    // set this after index updates so we know what indexes to remove from
    this.result.setEntity(key, pk, entity);

    if (updateMeta) this.result.setMeta(key, pk, meta);
  }

  /** Invalidates an entity, potentially triggering suspense */
  invalidate(schema: { key: string; indexes?: any }, pk: string) {
    // set directly: any queued updates are meaningless with delete
    this.setEntity(schema, pk, INVALID);
  }

  getMeta(key: string, pk: string) {
    return this.result.entitiesMeta[key][pk];
  }
}

class Normalized implements NormalizedSchema<EntityTable, any> {
  result: any = '';
  declare readonly entities: EntityTable;
  declare readonly indexes: {
    [entityKey: string]: {
      [indexName: string]: { [lookup: string]: string };
    };
  };

  declare readonly entitiesMeta: {
    [entityKey: string]: {
      [pk: string]: {
        date: number;
        expiresAt: number;
        fetchedAt: number;
      };
    };
  };

  protected new = {
    entities: new Map<string, Map<string, any>>(),
    indexes: new Map<string, Map<string, any>>(),
  };

  constructor({
    entities,
    indexes,
    entitiesMeta,
  }: {
    entities: EntityTable;
    indexes: NormalizedIndex;
    entitiesMeta: {
      [entityKey: string]: {
        [pk: string]: {
          date: number;
          expiresAt: number;
          fetchedAt: number;
        };
      };
    };
  }) {
    this.entities = { ...entities };
    this.indexes = { ...indexes };
    this.entitiesMeta = { ...entitiesMeta };
  }

  setEntity(key: string, pk: string, entity: any) {
    (this.entities[key] as any)[pk] = entity;
  }

  setMeta(
    key: string,
    pk: string,
    meta: { fetchedAt: number; date: number; expiresAt: number },
  ) {
    this.entitiesMeta[key][pk] = meta;
  }

  getEntity(key: string, pk: string) {
    return this.getEntities(key).get(pk);
  }

  getEntities(key: string): Map<string, any> {
    // first time we come across this type of entity
    if (!this.new.entities.has(key)) {
      this.new.entities.set(key, new Map());
      // we will be editing these, so we need to clone them first
      this.entities[key] = {
        ...this.entities[key],
      };
      this.entitiesMeta[key] = {
        ...this.entitiesMeta[key],
      };
    }

    return this.new.entities.get(key) as Map<string, any>;
  }

  getIndexes(key: string): Map<string, any> {
    if (!this.new.indexes.has(key)) {
      this.new.indexes.set(key, new Map());
      this.indexes[key] = { ...this.indexes[key] };
    }
    return this.new.indexes.get(key) as Map<string, any>;
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
