import { INVALID } from '../denormalize/symbol.js';
import type {
  QueryPath,
  IndexPath,
  IQueryDelegate,
  EntitiesInterface,
} from '../interface.js';
import type { Dep } from '../memo/WeakDependencyMap.js';

/** Basic state interfaces for normalize side */
export abstract class BaseDelegate {
  declare entities: any;
  declare indexes: any;

  constructor({ entities, indexes }: { entities: any; indexes: any }) {
    this.entities = entities;
    this.indexes = indexes;
  }

  abstract getEntities(key: string): EntitiesInterface | undefined;
  abstract getEntity(key: string, pk: string): object | undefined;
  abstract getIndex(...path: IndexPath): object | undefined;
  abstract getIndexEnd(entity: any, value: string): string | undefined;
  // we must expose the entities object to track in our WeakDependencyMap
  // however, this should not be part of the public API
  protected abstract getEntitiesObject(key: string): object | undefined;

  // only used in buildQueryKey
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
      getEntity(...path: [key: string, pk: string]) {
        const entity = base.getEntity(...path);
        dependencies.push({ path, entity });
        return entity;
      },
      getEntities(key: string): EntitiesInterface | undefined {
        const entity = base.getEntitiesObject(key);
        dependencies.push({ path: [key], entity });
        return base.getEntities(key);
      },
    };
    return [delegate, dependencies];
  }
}

export const getDependency =
  (delegate: BaseDelegate) =>
  (path: QueryPath): object | undefined =>
    delegate[['', 'getEntitiesObject', 'getEntity', 'getIndex'][path.length]](
      ...path,
    );
