import { Query, schema } from '@rest-hooks/rest';

import {
  createPlaceholderResource,
  PlaceholderEntity,
} from './PlaceholderBaseResource';

export class Todo extends PlaceholderEntity {
  readonly userId: number = 0;
  readonly title: string = '';
  readonly completed: boolean = false;

  static key = 'Todo';
}

const TodoResourceBase = createPlaceholderResource({
  path: '/todos/:id',
  schema: Todo,
});
export const TodoResource = {
  ...TodoResourceBase,
  getList: TodoResourceBase.getList.extend({
    searchParams: {} as { userId?: string | number } | undefined,
  }),
  partialUpdate: TodoResourceBase.partialUpdate.extend({
    getOptimisticResponse(snap, { id }, body) {
      return {
        id,
        ...body,
      };
    },
  }),
  create: TodoResourceBase.create.extend({
    getOptimisticResponse(snap, body) {
      return body;
    },
    update: (newResourceId: string, urlParams) => ({
      [TodoResourceBase.getList.key({ userId: urlParams?.userId })]: (
        resourceIds: string[] = [],
      ) => [...resourceIds, newResourceId],
    }),
  }),
  delete: TodoResourceBase.delete.extend({
    getOptimisticResponse(snap, params) {
      return params;
    },
  }),
};
export const queryRemaining = new Query(
  new schema.All(Todo),
  (entries, { userId } = {}) => {
    if (userId !== undefined)
      return entries.filter((todo) => todo.userId === userId && !todo.completed)
        .length;
    return entries.filter((todo) => !todo.completed).length;
  },
);
