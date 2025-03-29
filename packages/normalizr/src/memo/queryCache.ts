import { Dep } from './WeakDependencyMap.js';
import type {
  EntityTable,
  NormalizedIndex,
  QuerySnapshot,
} from '../interface.js';

export const getDependency =
  (snap: SnapshotCoreBase) =>
  (args: QueryPath): QueryPath | undefined =>
    // ignore third arg so we only track
    args.length === 3 ?
      snap.getIndex(args[0], args[1])
    : snap.getEntity(...(args as [any]));

export interface SnapshotCoreBase {
  entities: any;
  indexes: any;

  getEntity(entityKey: string | symbol, pk?: string): any;
  getIndex(key: string, field: string): any;
}

export class SnapshotCore implements SnapshotCoreBase {
  declare entities: EntityTable;
  declare indexes: NormalizedIndex;

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

  getIndex(key: string, field: string) {
    return this.indexes[key]?.[field];
  }
}

export class TrackedSnapshot implements QuerySnapshot {
  declare protected snap: SnapshotCoreBase;
  // first dep path is ignored
  // we start with schema object, then lookup any 'touched' members and their paths
  declare dependencies: Dep<QueryPath>[];

  constructor(snap: SnapshotCoreBase, schema: any) {
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

export type IndexPath = [key: string, field: string, value: string];
export type EntitySchemaPath = [key: string] | [key: string, pk: string];
export type QueryPath = IndexPath | EntitySchemaPath;
