import type { Schema } from './interface.js';
import type { AbstractInstanceType } from './normal.js';

/**
 * Performant lookups by secondary indexes
 * @see https://resthooks.io/docs/api/Index
 */
export class Index<S extends Schema, P = Readonly<IndexParams<S>>> {
  declare schema: S;
  constructor(schema: S, key?: (params: P) => string) {
    this.schema = schema;
    if (key) this.key = key;
  }

  key(params?: P) {
    return JSON.stringify(params);
  }

  /** The following is for compatibility with FetchShape */
  getFetchKey = (params: P) => {
    return this.key(params);
  };
}

export type ArrayElement<ArrayType extends unknown[] | readonly unknown[]> =
  ArrayType[number];

export type IndexParams<S extends Schema> = S extends {
  indexes: readonly string[];
}
  ? {
      [K in Extract<
        ArrayElement<S['indexes']>,
        keyof AbstractInstanceType<S>
      >]?: AbstractInstanceType<S>[K];
    }
  : Readonly<object>;
