import { Entity } from '@rest-hooks/endpoint';

export default class GQLEntity extends Entity {
  readonly id: string = '';
  pk() {
    return this.id;
  }
}
