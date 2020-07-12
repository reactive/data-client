import { Entity } from '@rest-hooks/normalizr';

import type { IndexInterface, IndexParams } from './interface';

export default class Index<E extends typeof Entity>
  implements IndexInterface<E> {
  declare schema: E;
  constructor(entity: E) {
    this.schema = entity;
  }

  key(params?: Readonly<IndexParams<E>>) {
    return JSON.stringify(params);
  }
}
