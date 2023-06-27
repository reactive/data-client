import { Entity, schema } from '@rest-hooks/rest';
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
export const TodoResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  searchParams: {} as { userId?: string | number } | undefined,
  schema: Todo,
  optimistic: true,
});

export class User extends Entity {
  id = 0;
  name = '';
  username = '';
  email = '';
  website = '';
  todos: Todo[] = [];

  get profileImage() {
    return `https://i.pravatar.cc/256?img=${this.id + 4}`;
  }

  pk() {
    return `${this.id}`;
  }

  static schema = {
    todos: new schema.Collection([Todo], {
      nestKey: (parent, key) => ({
        userId: parent.id,
      }),
    }),
  };
}
export const UserResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/users/:id',
  schema: User,
  optimistic: true,
});
