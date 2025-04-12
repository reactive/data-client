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

  getEntities({ key }: EntitiesPath): any {
    return this.entities.get(key)?.toJS();
  }

  getEntity({ key, pk }: EntityPath): any {
    return this.entities.getIn([key, pk]);
  }

  // this is different return value than QuerySnapshot
  getIndex({ key, field }: IndexPath): object | undefined {
    return this.indexes.getIn([key, field]);
  }

  getIndexEnd(
    entity: { get(k: string): string | undefined } | undefined,
    value: string,
  ) {
    return entity?.get?.(value);
  }
}
