import type { Interceptor } from '@data-client/test';

import { todos, users } from './assignees';
import { TodoResource, UserResource, type TodoData } from './todos';

/** The demo's server: its todos in list order, and the next id it gives */
type UserTodoServer = { todos: TodoData[]; nextId: number };

export const getInitialInterceptorData = (): UserTodoServer => {
  const seeded = Object.values(structuredClone(todos));
  return {
    todos: seeded,
    nextId: Math.max(...seeded.map(todo => todo.id)) + 1,
  };
};

type UserData = (typeof users)[number];

const todosOf = (server: UserTodoServer, userId: number | string) =>
  server.todos.filter(todo => todo.userId === Number(userId));

/** A user as `/users` sends them: with their todos nested */
const withTodos = (server: UserTodoServer, user: UserData) => ({
  ...user,
  todos: todosOf(server, user.id),
});

const notFound = (what: string) => ({ status: 404, message: `No ${what}` });

/** Long enough that a page waiting on a request shows it */
const delay = 300;

/** A team's todos: `/users` nests each user's todos, so one request loads
 * what the user and todo pages read. Every endpoint answers from one server,
 * which orders lists as the client's push and move do (new and moved todos
 * last), so a refetch (stale data, an edited demo) changes nothing on screen. */
export const userTodoFixtures: Interceptor<UserTodoServer>[] = [
  {
    endpoint: UserResource.getList,
    response() {
      return users.map(user => withTodos(this, user));
    },
    delay,
  },
  {
    endpoint: UserResource.get,
    response({ id }: Parameters<typeof UserResource.get>[0]) {
      const user = users.find(user => user.id === Number(id));
      if (!user) throw notFound(`user ${id}`);
      return withTodos(this, user);
    },
    delay,
  },
  {
    endpoint: TodoResource.getList,
    response(...args: Parameters<typeof TodoResource.getList>) {
      const userId = args[0]?.userId;
      return userId === undefined ? this.todos : todosOf(this, userId);
    },
    delay,
  },
  {
    endpoint: TodoResource.get,
    response({ id }: Parameters<typeof TodoResource.get>[0]) {
      const todo = this.todos.find(todo => todo.id === Number(id));
      if (!todo) throw notFound(`todo ${id}`);
      return todo;
    },
    delay,
  },
  {
    endpoint: TodoResource.getList.push,
    response(...args: Parameters<typeof TodoResource.getList.push>) {
      // the body is the last argument: push(body) or push(params, body)
      const body = args[args.length - 1] as Partial<TodoData>;
      const todo: TodoData = {
        userId: 0,
        title: '',
        completed: false,
        ...body,
        id: this.nextId++,
      };
      this.todos.push(todo);
      return todo;
    },
  },
  // also answers getList.move (the same PATCH)
  {
    endpoint: TodoResource.partialUpdate,
    response(
      { id }: Parameters<typeof TodoResource.partialUpdate>[0],
      body: Parameters<typeof TodoResource.partialUpdate>[1],
    ) {
      const index = this.todos.findIndex(todo => todo.id === Number(id));
      if (index === -1) throw notFound(`todo ${id}`);
      const stored = this.todos[index];
      const todo = { ...stored, ...body, id: stored.id };
      if (todo.userId === stored.userId) {
        this.todos[index] = todo;
      } else {
        // last in its new owner's list
        this.todos.splice(index, 1);
        this.todos.push(todo);
      }
      return todo;
    },
    delay: 150,
  },
  {
    endpoint: TodoResource.delete,
    response({ id }: Parameters<typeof TodoResource.delete>[0]) {
      const pk = Number(id);
      this.todos = this.todos.filter(todo => todo.id !== pk);
      return { id: pk };
    },
    delay: 150,
  },
];
