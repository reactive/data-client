import { Resource, SnapshotInterface } from '@rest-hooks/rest';

import PlaceholderBaseResource from './PlaceholderBaseResource';

export default class TodoResource extends PlaceholderBaseResource {
  readonly userId: number = 0;
  readonly title: string = '';
  readonly completed: boolean = false;

  static urlRoot = 'https://jsonplaceholder.typicode.com/todos';

  static partialUpdate<T extends typeof Resource>(this: T) {
    return super.partialUpdate().extend({
      schema: this,
      getOptimisticResponse: optimisticPartial,
    });
  }

  static create<T extends typeof Resource>(this: T) {
    const listkey = this.list().key({});
    return super.create().extend({
      schema: this,
      getOptimisticResponse: optimisticCreate,
      update: (newResourceId: string) => ({
        [listkey]: (resourceIds: string[] = []) => [
          ...resourceIds,
          newResourceId,
        ],
      }),
    });
  }
}

const optimisticPartial = (
  snap: SnapshotInterface,
  params: { id: string | number },
  body: any,
) => ({
  id: params.id,
  ...body,
});

const optimisticCreate = (snap: SnapshotInterface, body: any) => body;
