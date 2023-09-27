import { Query, schema } from '@data-client/rest';

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

export const TodoResource = createPlaceholderResource({
  path: '/todos/:id',
  schema: Todo,
  optimistic: true,
  searchParams: {} as { userId?: string | number } | undefined,
});

export const queryRemainingTodos = new Query(
  TodoResource.getList.schema,
  (entries) => entries && entries.filter((todo) => !todo.completed).length,
);
