import type { EntitiesPath, EntityPath, IndexPath } from '../interface.js';
import { BaseDelegate } from './BaseDelegate.js';

type ImmutableJSEntityTable = {
  get(key: string): { toJS(): any } | undefined;
  getIn(k: [key: string, pk: string]): { toJS(): any } | undefined;
  setIn(k: [key: string, pk: string], value: any);
};

export class DelegateImmutable extends BaseDelegate {
  declare entities: ImmutableJSEntityTable;
  declare indexes: ImmutableJSEntityTable;

  constructor(state: {
    entities: ImmutableJSEntityTable;
    indexes: ImmutableJSEntityTable;
  }) {
    super(state);
  }

  getEntities(key: string): any {
    return this.entities.get(key)?.toJS();
  }

  getEntity(...path: [key: string, pk: string]): any {
    return this.entities.getIn(path);
  }

  // this is different return value than QuerySnapshot
  getIndex(key: string, field: string): object | undefined {
    return this.indexes.getIn([key, field]);
  }

  getIndexEnd(
    entity: { get(k: string): string | undefined } | undefined,
    value: string,
  ) {
    return entity?.get?.(value);
  }
}
