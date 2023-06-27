import { Entity, Query, schema } from '@rest-hooks/rest';
import { createResource } from '@rest-hooks/rest/next';

export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
  pk() {
    return `${this.id}`;
  }
}
const BaseTodoResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  searchParams: {} as { userId?: string | number } | undefined,
  schema: Todo,
  optimistic: true,
});
export const TodoResource = {
  ...BaseTodoResource,
  queryRemaining: new Query(
    new schema.All(Todo),
    (entries, { userId } = {}) => {
      if (userId !== undefined)
        return entries.filter(todo => todo.userId === userId && !todo.completed)
          .length;
      return entries.filter(todo => !todo.completed).length;
    },
  ),
};
