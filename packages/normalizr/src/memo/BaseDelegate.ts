import type { Dep } from './WeakDependencyMap.js';
import { INVALID } from '../denormalize/symbol.js';
import type {
  EntityPath,
  QueryPath,
  IndexPath,
  EntitiesPath,
  IQueryDelegate,
} from '../interface.js';

export const getDependency =
  (delegate: BaseDelegate) =>
  (path: QueryPath): object | undefined =>
    delegate[['', 'getEntities', 'getEntity', 'getIndex'][path.length]](
      ...path,
    );

export abstract class BaseDelegate {
  declare entities: any;
  declare indexes: any;

  constructor({ entities, indexes }: { entities: any; indexes: any }) {
    this.entities = entities;
    this.indexes = indexes;
  }

  abstract getEntities(...path: EntitiesPath): object | undefined;
  abstract getEntity(...path: EntityPath): object | undefined;
  abstract getIndex(...path: IndexPath): object | undefined;
  abstract getIndexEnd(entity: any, value: string): string | undefined;

  tracked(
    schema: any,
  ): [delegate: IQueryDelegate, dependencies: Dep<QueryPath>[]] {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const base = this;
    const dependencies: Dep<QueryPath>[] = [{ path: [''], entity: schema }];
    const delegate = {
      INVALID,
      getIndex(...path: IndexPath): string | undefined {
        const entity = base.getIndex(...path);
        dependencies.push({ path, entity });
        return base.getIndexEnd(entity, path[2]);
      },
      getEntity(...path: EntityPath) {
        const entity = base.getEntity(...path);
        dependencies.push({ path, entity });
        return entity;
      },
      getEntities(...path: EntitiesPath) {
        const entity = base.getEntities(...path);
        dependencies.push({ path, entity });
        return entity;
      },
    };
    return [delegate, dependencies];
  }
}
