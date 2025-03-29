import { IndexPath, SnapshotCoreBase, TrackedSnapshot } from './queryCache.js';

type ImmutableJSEntityTable = {
  getIn(k: string[]): { toJS(): any } | undefined;
};

export class SnapshotCoreImmutable implements SnapshotCoreBase {
  declare entities: ImmutableJSEntityTable;
  declare indexes: ImmutableJSEntityTable;

  constructor(
    entities: ImmutableJSEntityTable,
    indexes: ImmutableJSEntityTable,
  ) {
    this.entities = entities;
    this.indexes = indexes;
  }

  getEntity(...args: [entityKey: string, pk?: string]): any {
    return this.entities.getIn(args as any);
  }

  getIndex(key: string, field: string) {
    return this.indexes.getIn([key, field]);
  }
}

export class TrackedSnapshotImmutable extends TrackedSnapshot {
  getIndex(...path: IndexPath): string | undefined {
    const entity = this.snap.getIndex(path[0], path[1]);
    this.dependencies.push({ path, entity });
    return entity?.get?.(path[2]);
  }
}
