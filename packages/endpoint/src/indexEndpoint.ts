import { Entity } from '@rest-hooks/normalizr/src';

import { IndexInterface, IndexParams } from './interface';

export default class Index<E extends typeof Entity>
  implements IndexInterface<E> {
  declare schema: E;
  constructor(entity: E) {
    this.schema = entity;
  }

  key(params?: Readonly<IndexParams<S>>) {
    return JSON.stringify(params);
  }
}
