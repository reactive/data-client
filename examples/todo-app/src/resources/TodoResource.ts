import { Resource } from '@rest-hooks/rest';

import PlaceholderBaseResource from './PlaceholderBaseResource';

export default class TodoResource extends PlaceholderBaseResource {
  readonly userId: number = 0;
  readonly title: string = '';
  readonly completed: boolean = false;

  static urlRoot = 'https://jsonplaceholder.typicode.com/todos';

  static partialUpdate<T extends typeof Resource>(this: T) {
    return super.partialUpdate().extend({
      schema: this,
      optimisticUpdate: optimisticPartial,
    });
  }

  static create<T extends typeof Resource>(this: T) {
    return super.create().extend({
      schema: this,
      optimisticUpdate: optimisticCreate,
      update: (newResourceId: string) => ({
        [this.list().key({})]: (resourceIds: string[] = []) => [
          ...resourceIds,
          newResourceId,
        ],
      }),
    });
  }
}

const optimisticPartial = (params: any, body: any) => ({
  id: params.id,
  ...body,
});

const optimisticCreate = (_: any, body: any) => body;
