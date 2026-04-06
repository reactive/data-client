import {
  EntityTable,
  NormalizedIndex,
  INormalizeDelegate,
  Mergeable,
} from '../interface.js';
import { getCheckLoop } from './getCheckLoop.js';
import { POJODelegate } from '../delegate/Delegate.js';
import { INVALID } from '../denormalize/symbol.js';

type MetaEntry = { fetchedAt: number; date: number; expiresAt: number };

/** Full normalize() logic for POJO state */
export class NormalizeDelegate
  extends POJODelegate
  implements INormalizeDelegate
{
  declare readonly entitiesMeta: {
    [entityKey: string]: {
      [pk: string]: MetaEntry;
    };
  };

  declare readonly meta: MetaEntry;
  declare checkLoop: (entityKey: string, pk: string, input: object) => boolean;

  protected newEntities = new Map<string, Map<string, any>>();
  protected newIndexes = new Map<string, Map<string, any>>();
  private newMeta = new Map<string, Map<string, MetaEntry>>();

  constructor(
    state: {
      entities: EntityTable;
      indexes: NormalizedIndex;
      entitiesMeta: {
        [entityKey: string]: {
          [pk: string]: MetaEntry;
        };
      };
    },
    actionMeta: MetaEntry,
  ) {
    super(state);
    this.entitiesMeta = state.entitiesMeta;
    this.meta = actionMeta;
    this.checkLoop = getCheckLoop();
  }

  protected getNewEntity(key: string, pk: string) {
    return this.newEntities.get(key)?.get(pk);
  }

  protected getNewEntities(key: string): Map<string, any> {
    let map = this.newEntities.get(key);
    if (map === undefined) {
      map = new Map();
      this.newEntities.set(key, map);
    }
    return map;
  }

  protected getNewIndexes(key: string): Map<string, any> {
    let map = this.newIndexes.get(key);
    if (map === undefined) {
      map = new Map();
      this.newIndexes.set(key, map);
      this.indexes[key] = { ...this.indexes[key] };
    }
    return map;
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
    let entity = this.getNewEntity(key, pk);
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
    meta: MetaEntry = this.meta,
  ) {
    const key = schema.key;
    const newEntities = this.getNewEntities(key);
    const updateMeta = !newEntities.has(pk);

    // update index before setting new entity so we can look up old values
    if (schema.indexes) {
      // look up the previous entity: in-progress Map first, then original store
      const oldEntity = newEntities.get(pk) ?? this.entities[key]?.[pk];
      handleIndexes(
        pk,
        schema.indexes,
        this.getNewIndexes(key),
        this.indexes[key],
        entity,
        oldEntity,
      );
    }

    newEntities.set(pk, entity);

    if (updateMeta) {
      let metaMap = this.newMeta.get(key);
      if (metaMap === undefined) {
        metaMap = new Map();
        this.newMeta.set(key, metaMap);
      }
      metaMap.set(pk, meta);
    }
  }

  /** Invalidates an entity, potentially triggering suspense */
  invalidate({ key }: { key: string }, pk: string) {
    // set directly: any queued updates are meaningless with delete
    this.setEntity({ key }, pk, INVALID);
  }

  /** Build final POJOs from original store + in-progress Maps.
   *  Each property is written exactly once, keeping V8 field constness intact. */
  finalize() {
    for (const [key, map] of this.newEntities) {
      const original = this.entities[key];
      const result: Record<string, any> = {};
      if (original) {
        const keys = Object.keys(original);
        for (let i = 0; i < keys.length; i++) {
          const pk = keys[i];
          result[pk] = map.get(pk) ?? original[pk];
        }
      }
      for (const [pk, entity] of map) {
        if (!(pk in result)) result[pk] = entity;
      }
      this.entities[key] = result;
    }
    for (const [key, metaMap] of this.newMeta) {
      const original = this.entitiesMeta[key];
      const result: Record<string, MetaEntry> = {};
      if (original) {
        const keys = Object.keys(original);
        for (let i = 0; i < keys.length; i++) {
          const pk = keys[i];
          result[pk] = metaMap.get(pk) ?? original[pk];
        }
      }
      for (const [pk, meta] of metaMap) {
        if (!(pk in result)) result[pk] = meta;
      }
      (this.entitiesMeta as any)[key] = result;
    }
  }

  getMeta(key: string, pk: string) {
    return this.newMeta.get(key)?.get(pk) ?? this.entitiesMeta[key]?.[pk];
  }
}

function handleIndexes(
  id: string,
  schemaIndexes: string[],
  indexes: Map<string, any>,
  storeIndexes: Record<string, any>,
  entity: any,
  oldEntity: any,
) {
  for (const index of schemaIndexes) {
    if (!indexes.has(index)) {
      indexes.set(index, (storeIndexes[index] = {}));
    }
    const indexMap = indexes.get(index);
    if (oldEntity) {
      delete indexMap[oldEntity[index]];
    }
    // entity already in cache but the index changed
    if (oldEntity && oldEntity[index] !== entity[index]) {
      indexMap[oldEntity[index]] = INVALID;
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
