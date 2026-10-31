import { Entity, Collection, resource, RestEndpoint } from '@data-client/rest';
import type { Interceptor } from '@data-client/test';

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
/** The demo's server: every todo it has sent, by id, with every edit since
 * (`null` once deleted). jsonplaceholder doesn't store changes, so lists are
 * built from these. */
export type TodoServer = Record<number, TodoData | null>;

/** New todos get ids after jsonplaceholder's 200 */
const LAST_SEEDED_ID = 200;

/** Adds the `todos` this server hasn't seen. It keeps its own copy of the
 * rest, deleted ones included, since jsonplaceholder sends their originals
 * again on a refetch. */
export function rememberTodos(server: TodoServer, todos: TodoData[]) {
  for (const todo of todos) if (!(todo.id in server)) server[todo.id] = todo;
}

/** The server's todos, oldest first; only `userId`'s when given */
export function todosOf(server: TodoServer, userId?: number | string) {
  const todos = Object.values(server).filter(todo => todo !== null);
  if (userId === undefined) return todos;
  return todos.filter(todo => todo.userId === Number(userId));
}

/** The todo endpoints, for demos that bring their own user list */
export const todoEndpointFixtures: Interceptor<TodoServer>[] = [
  {
    endpoint: TodoResource.getList,
    async response(...args: Parameters<typeof TodoResource.getList>) {
      rememberTodos(this, (await TodoResource.getList(...args)).slice(0, 7));
      return todosOf(this, args[0]?.userId);
    },
  },
  // also answers getList.move (the same PATCH)
  {
    endpoint: TodoResource.partialUpdate,
    response(
      { id }: Parameters<typeof TodoResource.partialUpdate>[0],
      body: Parameters<typeof TodoResource.partialUpdate>[1],
    ) {
      const pk = Number(id);
      const stored = this[pk];
      // an edit sent just after a delete, like a real server's 404
      if (!stored) throw new Error(`Todo ${pk} not found`);
      const todo = { ...stored, ...body, id: pk };
      this[pk] = todo;
      return todo;
    },
    // stands in for the round trip it no longer makes
    delay: 150,
  },
  {
    endpoint: TodoResource.getList.push,
    async response(...args: Parameters<typeof TodoResource.getList.push>) {
      const todo = {
        ...(await TodoResource.getList.push(...args)),
        // after every id the server has, so todos list in creation order
        id: Math.max(...Object.keys(this).map(Number), LAST_SEEDED_ID) + 1,
      };
      this[todo.id] = todo;
      return todo;
    },
  },
  {
    endpoint: TodoResource.delete,
    response({ id }: Parameters<typeof TodoResource.delete>[0]) {
      this[Number(id)] = null;
      return { id: Number(id) };
    },
    delay: 150,
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
