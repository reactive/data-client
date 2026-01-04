import { INormalizeDelegate, Mergeable } from '../interface.js';
import { getCheckLoop } from './getCheckLoop.js';
import {
  ImmDelegate,
  ImmutableJSEntityTable,
} from '../delegate/Delegate.imm.js';
import { INVALID } from '../denormalize/symbol.js';

/** ImmutableJS state table that supports setIn with variable path lengths */
export interface ImmutableJSMutableTable {
  get(key: string): any;
  getIn(k: readonly (string | number)[]): any;
  setIn(k: readonly (string | number)[], value: any): ImmutableJSMutableTable;
  hasIn?(k: readonly (string | number)[]): boolean;
}

/** Full normalize() logic for ImmutableJS state */
export class ImmNormalizeDelegate
  extends ImmDelegate
  implements INormalizeDelegate
{
  // Override with mutable table type that supports variable path lengths
  declare entities: ImmutableJSMutableTable;
  declare indexes: ImmutableJSMutableTable;
  declare entitiesMeta: ImmutableJSMutableTable;

  declare readonly meta: { fetchedAt: number; date: number; expiresAt: number };
  declare checkLoop: (entityKey: string, pk: string, input: object) => boolean;

  protected newEntities = new Map<string, Map<string, any>>();
  protected newIndexes = new Map<string, Map<string, any>>();

  constructor(
    state: {
      entities: ImmutableJSMutableTable;
      indexes: ImmutableJSMutableTable;
      entitiesMeta: ImmutableJSMutableTable;
    },
    actionMeta: { fetchedAt: number; date: number; expiresAt: number },
  ) {
    super(
      state as {
        entities: ImmutableJSEntityTable;
        indexes: ImmutableJSEntityTable;
      },
    );
    this.entitiesMeta = state.entitiesMeta;
    this.meta = actionMeta;
    this.checkLoop = getCheckLoop();
  }

  protected getNewEntity(key: string, pk: string) {
    return this.getNewEntities(key).get(pk);
  }

  protected getNewEntities(key: string): Map<string, any> {
    // first time we come across this type of entity
    if (!this.newEntities.has(key)) {
      this.newEntities.set(key, new Map());
    }
    return this.newEntities.get(key) as Map<string, any>;
  }

  protected getNewIndexes(key: string): Map<string, any> {
    if (!this.newIndexes.has(key)) {
      this.newIndexes.set(key, new Map());
    }
    return this.newIndexes.get(key) as Map<string, any>;
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
    meta: { fetchedAt: number; date: number; expiresAt: number } = this.meta,
  ) {
    const key = schema.key;
    const newEntities = this.getNewEntities(key);
    const updateMeta = !newEntities.has(pk);
    newEntities.set(pk, entity);

    // update index
    if (schema.indexes) {
      this.handleIndexes(pk, key, schema.indexes, entity);
    }

    // set this after index updates so we know what indexes to remove from
    this._setEntity(key, pk, entity);

    if (updateMeta) this._setMeta(key, pk, meta);
  }

  /** Invalidates an entity, potentially triggering suspense */
  invalidate({ key }: { key: string }, pk: string) {
    // set directly: any queued updates are meaningless with delete
    this.setEntity({ key }, pk, INVALID);
  }

  protected _setEntity(key: string, pk: string, entity: any) {
    this.entities = this.entities.setIn([key, pk], entity);
  }

  protected _setMeta(
    key: string,
    pk: string,
    meta: { fetchedAt: number; date: number; expiresAt: number },
  ) {
    this.entitiesMeta = this.entitiesMeta.setIn([key, pk], meta);
  }

  getMeta(key: string, pk: string) {
    return this.entitiesMeta.getIn([key, pk]);
  }

  protected handleIndexes(
    id: string,
    entityKey: string,
    schemaIndexes: string[],
    entity: any,
  ) {
    const indexes = this.getNewIndexes(entityKey);
    const existingEntity = this.getEntity(entityKey, id);

    for (const index of schemaIndexes) {
      if (!indexes.has(index)) {
        indexes.set(index, new Map());
      }
      const indexMap = indexes.get(index);

      // If entity already exists, remove old index entry
      if (existingEntity) {
        const oldIndexValue =
          existingEntity[index] ?? existingEntity.get?.(index);
        if (oldIndexValue !== undefined) {
          indexMap.set(oldIndexValue, INVALID);
          // Write invalidation to immutable indexes
          this.indexes = this.indexes.setIn(
            [entityKey, index, oldIndexValue],
            INVALID,
          );
        }
      }

      // Add new index entry
      const newIndexValue = entity[index] ?? entity.get?.(index);
      if (newIndexValue !== undefined) {
        indexMap.set(newIndexValue, id);
        // Update the immutable indexes
        this.indexes = this.indexes.setIn(
          [entityKey, index, newIndexValue],
          id,
        );
      }
    }
  }
}
