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
    const listkey = this.list().key({});
    return super.create().extend({
      schema: this,
      optimisticUpdate: optimisticCreate,
      update: (newResourceId: string) => ({
        [listkey]: (resourceIds: string[] = []) => [
          ...resourceIds,
          newResourceId,
        ],
      }),
    });
  }

  static delete<T extends typeof Resource>(this: T) {
    return super.delete().extend({
      optimisticUpdate: optimisticDelete,
    });
  }
}

const optimisticPartial = (params: any, body: any) => ({
  id: params.id,
  ...body,
});

const optimisticCreate = (_: any, body: any) => body;
const optimisticDelete = (params: any) => params;
