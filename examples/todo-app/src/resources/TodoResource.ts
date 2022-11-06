import {
  createPlaceholderResource,
  PlaceholderEntity,
} from './PlaceholderBaseResource';

export class Todo extends PlaceholderEntity {
  readonly userId: number = 0;
  readonly title: string = '';
  readonly completed: boolean = false;
}

const TodoResourceBase = createPlaceholderResource({
  path: 'https\\://jsonplaceholder.typicode.com/todos/:id',
  schema: Todo,
});
export const TodoResource = {
  ...TodoResourceBase,
  partialUpdate: TodoResourceBase.partialUpdate.extend({
    getOptimisticResponse(snap, params, body) {
      return {
        id: params.id,
        ...body,
      };
    },
  }),
  create: TodoResourceBase.create.extend({
    getOptimisticResponse(snap, body) {
      return body;
    },
  }),
};
