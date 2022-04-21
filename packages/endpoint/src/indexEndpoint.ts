import { Schema } from '@rest-hooks/normalizr';

import type { IndexInterface, IndexParams } from './interface.js';

/**
 * Performant lookups by secondary indexes
 * @see https://resthooks.io/docs/api/Index
 */
export default class Index<S extends Schema, P = Readonly<IndexParams<S>>>
  implements IndexInterface<S, P>
{
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
