import type {
  EntityTable,
  NormalizedIndex,
  EntityPath,
  IndexPath,
  EntitiesPath,
} from '../interface.js';
import { BaseDelegate } from './BaseDelegate.js';

export class PlainDelegate extends BaseDelegate {
  declare entities: EntityTable;
  declare indexes: {
    [entityKey: string]: {
      [indexName: string]: { [lookup: string]: string };
    };
  };

  constructor(state: { entities: EntityTable; indexes: NormalizedIndex }) {
    super(state);
  }

  getEntities({ key }: EntitiesPath): any {
    return this.entities[key];
  }

  getEntity({ key, pk }: EntityPath): any {
    return this.entities[key]?.[pk];
  }

  // this is different return value than QuerySnapshot
  getIndex({ key, field }: IndexPath): object | undefined {
    return this.indexes[key]?.[field];
  }

  getIndexEnd(entity: object | undefined, value: string) {
    return entity?.[value];
  }
}
