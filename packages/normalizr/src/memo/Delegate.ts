import { Dep } from './WeakDependencyMap.js';
import type {
  EntityTable,
  NormalizedIndex,
  IQueryDelegate,
} from '../interface.js';
import { QueryPath, IndexPath } from './types.js';

export const getDependency =
  (delegate: IBaseDelegate) =>
  (args: QueryPath): QueryPath | undefined =>
    // ignore third arg so we only track
    args.length === 3 ?
      delegate.getIndex(args[0], args[1])
    : delegate.getEntity(...(args as [any]));

export interface IBaseDelegate {
  entities: any;
  indexes: any;

  getEntity(entityKey: string | symbol, pk?: string): any;
  getIndex(key: string, field: string): any;
}

export class BaseDelegate implements IBaseDelegate {
  declare entities: EntityTable;
  declare indexes: {
    [entityKey: string]: {
      [indexName: string]: { [lookup: string]: string };
    };
  };

  constructor(entities: EntityTable, indexes: NormalizedIndex) {
    this.entities = entities;
    this.indexes = indexes;
  }

  getEntity(
    entityKey: string | symbol,
  ): { readonly [pk: string]: any } | undefined;

  getEntity(entityKey: string | symbol, pk: string | number): any;

  getEntity(entityKey: string, pk?: any): any {
    return pk ? this.entities[entityKey]?.[pk] : this.entities[entityKey];
  }

  // this is different return value than QuerySnapshot
  getIndex(key: string, field: string) {
    return this.indexes[key]?.[field];
  }
}

export class TrackingQueryDelegate implements IQueryDelegate {
  declare protected snap: IBaseDelegate;
  // first dep path is ignored
  // we start with schema object, then lookup any 'touched' members and their paths
  declare dependencies: Dep<QueryPath>[];

  constructor(snap: IBaseDelegate, schema: any) {
    this.snap = snap;
    this.dependencies = [{ path: [''], entity: schema }];
  }

  getIndex(...path: IndexPath): string | undefined {
    const entity = this.snap.getIndex(path[0], path[1]);
    this.dependencies.push({ path, entity });
    return entity?.[path[2]];
  }

  getEntity(
    entityKey: string | symbol,
  ): { readonly [pk: string]: any } | undefined;

  getEntity(entityKey: string | symbol, pk: string | number): any;

  getEntity(...path: any): any {
    const entity = this.snap.getEntity(...(path as [any]));
    this.dependencies.push({ path, entity });
    return entity;
  }
}
