import { Entity } from '@rest-hooks/normalizr';

export default class GQLEntity extends Entity {
  readonly id: string = '';
  pk() {
    return this.id;
  }
}
