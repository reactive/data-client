import { schema } from '@data-client/rest';

import {
  createPlaceholderResource,
  PlaceholderEntity,
} from './PlaceholderBaseResource';

export class Todo extends PlaceholderEntity {
  userId = 0;
  title = '';
  completed = false;

  static key = 'Todo';
}

export const TodoResource = createPlaceholderResource({
  path: '/todos/:id',
  schema: Todo,
  optimistic: true,
  searchParams: {} as { userId?: string | number } | undefined,
});

export const queryRemainingTodos = new schema.Query(
  TodoResource.getList.schema,
  (entries) => entries.filter((todo) => !todo.completed).length,
);
