import { Entity, Collection, resource, RestEndpoint } from '@data-client/rest';
import type { Interceptor } from '@data-client/test';
import { v4 as uuid } from 'uuid';

export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;

  static key = 'Todo';
}
export const TodoResource = resource({
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
    return `https://i.pravatar.cc/64?img=${this.id + 4}`;
  }

  static key = 'User';

  static schema = {
    todos: new Collection([Todo], {
      nestKey: (parent, key) => ({
        userId: parent.id,
      }),
    }),
  };
}
export const UserResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/users/:id',
  schema: User,
  optimistic: true,
});

/** A todo as jsonplaceholder sends it */
export type TodoData = Pick<Todo, 'id' | 'userId' | 'title' | 'completed'>;
/** The demo's server: every todo it has sent, by id */
export type TodoServer = Record<number, TodoData>;

/** Keeps `todo` on the server, so later edits merge into it */
export function rememberTodo(server: TodoServer, todo: TodoData) {
  server[todo.id] = todo;
  return todo;
}

/** The todo endpoints, for demos that bring their own user list */
export const todoEndpointFixtures: Interceptor<TodoServer>[] = [
  {
    endpoint: TodoResource.getList,
    async response(...args: Parameters<typeof TodoResource.getList>) {
      return (await TodoResource.getList(...args))
        .slice(0, 7)
        .map((todo: TodoData) => rememberTodo(this, todo));
    },
  },
  // also answers getList.move (the same PATCH). jsonplaceholder doesn't
  // store edits, so each one merges into the todo as this server last sent it
  {
    endpoint: TodoResource.partialUpdate,
    response(
      { id }: Parameters<typeof TodoResource.partialUpdate>[0],
      body: Parameters<typeof TodoResource.partialUpdate>[1],
    ) {
      const pk = Number(id);
      return rememberTodo(this, { ...this[pk], ...body, id: pk });
    },
    // stands in for the round trip it no longer makes
    delay: 150,
  },
  {
    endpoint: TodoResource.getList.push,
    async response(...args: Parameters<typeof TodoResource.getList.push>) {
      return rememberTodo(this, {
        ...(await TodoResource.getList.push(...args)),
        id: randomId(),
      });
    },
  },
];

export const todoFixtures: Interceptor<TodoServer>[] = [
  {
    endpoint: UserResource.getList,
    async response(...args: Parameters<typeof UserResource.getList>) {
      return (await UserResource.getList(...args)).slice(0, 3);
    },
  },
  ...todoEndpointFixtures,
];
function randomId() {
  return Number.parseInt(uuid().slice(0, 8), 16);
}

/** RestEndpoint's simplest retrieval: `path: '/todos/:id'`, with no `urlPrefix` */
export const todoByIdFixtures: Interceptor[] = [
  {
    endpoint: new RestEndpoint({ path: '/todos/:id' }),
    response: ({ id }: { id: string | number }) => ({
      userId: 1,
      id: Number(id),
      title: 'delectus aut autem',
      completed: false,
    }),
  },
];
