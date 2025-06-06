import { INVALID } from '../denormalize/symbol.js';
import type {
  QueryPath,
  IndexPath,
  EntitiesPath,
  IQueryDelegate,
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

  abstract forEntities(
    key: string,
    callbackfn: (value: [string, unknown]) => void,
  ): boolean;

  // we must expose the entities object to track in our WeakDependencyMap
  // however, this should not be part of the public API
  protected abstract getEntities(key: string): object | undefined;
  abstract getEntityKeys(key: string): string[] | symbol;
  abstract getEntity(key: string, pk: string): object | undefined;
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
      getEntity(...path: [key: string, pk: string]) {
        const entity = base.getEntity(...path);
        dependencies.push({ path, entity });
        return entity;
      },
      forEntities(
        key: string,
        callbackfn: (value: [string, any]) => void,
      ): boolean {
        const entity = base.getEntities(key);
        // always push even if entity is undefined
        dependencies.push({ path: [key], entity });
        return base.forEntities(key, callbackfn);
      },
      getEntityKeys(key: string): string[] | symbol {
        const entity = base.getEntities(key);
        dependencies.push({ path: [key], entity });
        return base.getEntityKeys(key);
      },
    };
    return [delegate, dependencies];
  }
}
