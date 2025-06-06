import { BaseDelegate } from './BaseDelegate.js';
import { INVALID } from '../denormalize/symbol.js';

export type ImmutableJSEntityTable = {
  get(key: string):
    | {
        forEach(
          sideEffect: (value: any, key: string, iter: any) => unknown,
          context?: unknown,
        ): number;
        keySeq(): { toArray(): string[] };
      }
    | undefined;
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

  forEntities(
    key: string,
    callbackfn: (value: [string, unknown]) => void,
  ): boolean {
    const entities = this.getEntities(key);
    if (!entities) return false;
    entities.forEach((entity: any, pk: string) => {
      callbackfn([pk, entity]);
    });
    return true;
  }

  getEntityKeys(key: string): string[] | symbol {
    const entities = this.getEntities(key);
    if (entities === undefined) return INVALID;
    return entities.keySeq().toArray();
  }

  protected getEntities(key: string):
    | {
        forEach(
          sideEffect: (value: any, key: string, iter: any) => unknown,
          context?: unknown,
        ): number;
        keySeq(): { toArray(): string[] };
      }
    | undefined {
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
