import { Query } from '@data-client/rest';

import {
  placeholderResource,
  PlaceholderEntity,
} from './PlaceholderBaseResource';

export class Todo extends PlaceholderEntity {
  userId = 0;
  title = '';
  completed = false;

  static key = 'Todo';
}

export const TodoResource = placeholderResource({
  path: '/todos/:id',
  schema: Todo,
  optimistic: true,
  searchParams: {} as { userId?: string | number } | undefined,
});

export const queryRemainingTodos = new Query(
  TodoResource.getList.schema,
  entries => entries.filter(todo => !todo.completed).length,
);
