import type {
  EntitiesInterface,
  EntityTable,
  NormalizedIndex,
} from '../interface.js';
import { BaseDelegate } from './BaseDelegate.js';

/** Basic POJO state interfaces for normalize side
 * Used directly as QueryDelegate, and inherited by NormalizeDelegate
 */
export class POJODelegate extends BaseDelegate {
  declare entities: EntityTable;
  declare indexes: {
    [entityKey: string]: {
      [indexName: string]: { [lookup: string]: string };
    };
  };

  constructor(state: { entities: EntityTable; indexes: NormalizedIndex }) {
    super(state);
  }

  // we must expose the entities object to track in our WeakDependencyMap
  // however, this should not be part of the public API
  protected getEntitiesObject(key: string): object | undefined {
    return this.entities[key];
  }

  getEntities(key: string): EntitiesInterface | undefined {
    const entities = this.entities[key];
    if (entities === undefined) return undefined;
    return {
      keys(): IterableIterator<string> {
        return Object.keys(entities) as any;
      },
      entries(): IterableIterator<[string, any]> {
        return Object.entries(entities) as any;
      },
    };
  }

  getEntity(key: string, pk: string): any {
    return this.entities[key]?.[pk];
  }

  // this is different return value than QuerySnapshot
  getIndex(key: string, field: string): object | undefined {
    return this.indexes[key]?.[field];
  }

  getIndexEnd(entity: object | undefined, value: string) {
    return entity?.[value];
  }
}
