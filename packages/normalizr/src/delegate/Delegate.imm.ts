import { BaseDelegate } from './BaseDelegate.js';
import { EntitiesInterface } from '../interface.js';

export type ImmutableJSEntityTable = {
  get(key: string): EntitiesInterface | undefined;
  getIn(k: [key: string, pk: string]): { toJS(): any } | undefined;
  setIn(k: [key: string, pk: string], value: any);
};

/** Basic ImmutableJS state interfaces for normalize side */
export class ImmDelegate extends BaseDelegate {
  declare entities: ImmutableJSEntityTable;
  declare indexes: ImmutableJSEntityTable;

  constructor(state: {
    entities: ImmutableJSEntityTable;
    indexes: ImmutableJSEntityTable;
  }) {
    super(state);
  }

  // we must expose the entities object to track in our WeakDependencyMap
  // however, this should not be part of the public API
  protected getEntitiesObject(key: string): object | undefined {
    return this.entities.get(key);
  }

  getEntities(key: string): EntitiesInterface | undefined {
    return this.entities.get(key);
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
