import {
  Endpoint,
  EndpointOptions,
  FetchFunction,
  schema,
  Schema,
} from '@data-client/endpoint';
import { DenormalizeNullable } from '@data-client/react';
import { IDBPDatabase, openDB } from 'idb';

import { Entity } from '../../../../packages/endpoint/lib/schema';

export default class LocalEndpoint<
  F extends (
    this: LocalEndpoint<FetchFunction, any>,
    params?: any,
    body?: any,
  ) => Promise<any>,
  S extends Schema,
  M extends boolean | undefined = false,
> extends Endpoint<F, S, M> {
  declare static db: IDBPDatabase;
  declare schema: S;
  constructor(options: EndpointOptions<F, S, M>) {
    super(
      options.execute ??
        async function (...args) {
          return this.execute(options.db ?? LocalEndpoint.db, ...args);
        },
      options,
    );
    Object.defineProperty(self, 'name', {
      get() {
        return this.schema.key;
      },
    });
  }

  async execute(db: IDBPDatabase, ...args: any[]) {
    return undefined;
  }

  static {
    if (typeof window !== 'undefined') {
      openDB('data-client').then(db => {
        LocalEndpoint.db = db;
      });
    }
  }
}

export class GetEndpoint<S extends Schema> extends LocalEndpoint<
  (id: string | number) => Promise<DenormalizeNullable<S>>,
  S,
  false
> {
  sideEffect = false as const;
  async execute(db: IDBPDatabase, query) {
    return db.get(this.schema.key, query);
  }
}

class MyClass extends Entity {
  id = '';
  static key = 'MyClass';
}

if (typeof window !== 'undefined') {
  openDB('data-client').then(db => {
    LocalEndpoint.db = db;
  });
}

const MyResource = {
  get: new Endpoint((id: string) => LocalEndpoint.db.get(MyClass.key, id), {
    schema: MyClass,
  }),
  getList: new Endpoint(
    (query?: string) => LocalEndpoint.db.getAll(MyClass.key, query),
    { schema: new schema.Collection([MyClass]) },
  ),
  update: new Endpoint(
    (value: MyClass, query?: string) =>
      LocalEndpoint.db.put(MyClass.key, value, query),
    { schema: MyClass },
  ),
};
