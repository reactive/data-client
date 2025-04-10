import { IBaseDelegate } from '../interface.js';
import { TrackingQueryDelegate } from './Delegate.js';
import { IndexPath } from './types.js';

type ImmutableJSEntityTable = {
  getIn(k: [key: string, pk: string]): { toJS(): any } | undefined;
  setIn(k: [key: string, pk: string], value: any);
};

export class DelegateImmutable implements IBaseDelegate {
  declare entities: ImmutableJSEntityTable;
  declare indexes: ImmutableJSEntityTable;

  constructor({
    entities,
    indexes,
  }: {
    entities: ImmutableJSEntityTable;
    indexes: ImmutableJSEntityTable;
  }) {
    this.entities = entities;
    this.indexes = indexes;
  }

  getEntity(...args: [entityKey: string, pk?: string]): any {
    // TODO: Don't make consumer depend on this going toJS()
    return args.length === 1 ?
        this.entities.getIn(args as any)?.toJS()
      : this.entities.getIn(args as any);
  }

  getIndex(key: string, field: string) {
    return this.indexes.getIn([key, field]);
  }

  tracked(schema: any) {
    return new TrackingQueryDelegateImmutable(this, schema);
  }
}

export class TrackingQueryDelegateImmutable extends TrackingQueryDelegate {
  getIndex(...path: IndexPath): string | undefined {
    const entity = this.snap.getIndex(path[0], path[1]);
    this.dependencies.push({ path, entity });
    return entity?.get?.(path[2]);
  }
}
