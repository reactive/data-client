import type { EntityTable, NormalizedIndex } from '../interface.js';
import { BaseDelegate } from './BaseDelegate.js';

/** Basic POJO state interfaces for normalize side */
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

  getEntities(key: string): any {
    return this.entities[key];
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
