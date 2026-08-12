import { RestEndpoint } from '@data-client/rest';
import type { Interceptor } from '@data-client/test';
import { v4 as uuid } from 'uuid';

export type AcidTodo = {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
};

export type AcidTodoState = {
  todos: AcidTodo[];
};

export type AcidUser = {
  id: string;
  name: string;
};

export type AcidConsistencyState = AcidTodoState & {
  users: AcidUser[];
};

const getTodoList = new RestEndpoint({
  path: '/todos',
  searchParams: {} as { userId?: string | number } | undefined,
});
const getTodo = new RestEndpoint({
  path: '/todos/:id',
});
const partialUpdateTodo = new RestEndpoint({
  path: '/todos/:id',
  method: 'PATCH',
});
const createTodo = new RestEndpoint({
  path: '/todos',
  method: 'POST',
});
const deleteTodo = new RestEndpoint({
  path: '/todos/:id',
  method: 'DELETE',
});
const getUser = new RestEndpoint({
  path: '/users/:id',
});

export function getAcidTodoData(): AcidTodoState {
  return {
    todos: [
      {
        id: '1',
        userId: '1',
        title: 'Write tests',
        completed: false,
      },
      {
        id: '2',
        userId: '1',
        title: 'Ship it',
        completed: false,
      },
      {
        id: '3',
        userId: '1',
        title: 'Take a break',
        completed: true,
      },
    ],
  };
}

export function getAcidConsistencyData(): AcidConsistencyState {
  return {
    users: [{ id: '1', name: 'Bob' }],
    todos: getAcidTodoData().todos,
  };
}

export type AcidSideEffectState = AcidTodoState & {
  users: (AcidUser & { todoCount: number })[];
};

export function getAcidSideEffectData(): AcidSideEffectState {
  const todos = getAcidTodoData().todos;
  return {
    todos,
    users: [
      {
        id: '1',
        name: 'Bob',
        todoCount: todos.filter(todo => todo.userId === '1').length,
      },
    ],
  };
}

export const acidTodoFixtures: Interceptor<AcidTodoState>[] = [
  {
    endpoint: getTodoList,
    response(params) {
      if (params?.userId != null) {
        return this.todos.filter(todo => todo.userId == params.userId);
      }
      return this.todos;
    },
    delay: 150,
  },
  {
    endpoint: getTodo,
    response({ id }) {
      return this.todos.find(todo => todo.id == id);
    },
    delay: 150,
  },
  {
    endpoint: partialUpdateTodo,
    response({ id }, body) {
      const todo = this.todos.find(item => item.id == id);
      if (!todo) return { id, ...body };
      Object.assign(todo, body);
      return { ...todo };
    },
    delay: 150,
  },
  {
    endpoint: createTodo,
    response(body) {
      const todo = {
        completed: false,
        ...body,
        id: uuid(),
      };
      this.todos.push(todo);
      return todo;
    },
    delay: 150,
  },
  {
    endpoint: deleteTodo,
    response({ id }) {
      this.todos = this.todos.filter(todo => todo.id != id);
      return { id };
    },
    delay: 150,
  },
];

export const acidConsistencyFixtures: Interceptor<AcidConsistencyState>[] = [
  ...acidTodoFixtures,
  {
    endpoint: getUser,
    response({ id }) {
      const user = this.users.find(item => item.id == id);
      if (!user) return { id, todos: [] };
      return {
        ...user,
        todos: this.todos.filter(todo => todo.userId == id),
      };
    },
    delay: 150,
  },
];

export const acidRollbackFixtures: Interceptor<AcidTodoState>[] = [
  {
    endpoint: getTodoList,
    response(params) {
      if (params?.userId != null) {
        return this.todos.filter(todo => todo.userId == params.userId);
      }
      return this.todos;
    },
    delay: 150,
  },
  {
    endpoint: createTodo,
    response() {
      throw Object.assign(new Error('Internal Server Error'), {
        status: 500,
      });
    },
    delay: 500,
  },
];

export const acidSideEffectFixtures: Interceptor<AcidSideEffectState>[] = [
  {
    endpoint: getTodoList,
    response(params) {
      if (params?.userId != null) {
        return this.todos.filter(todo => todo.userId == params.userId);
      }
      return this.todos;
    },
    delay: 150,
  },
  {
    endpoint: getUser,
    response({ id }) {
      const user = this.users.find(item => item.id == id);
      if (!user) return { id, todoCount: 0 };
      return { ...user };
    },
    delay: 150,
  },
  {
    endpoint: createTodo,
    response(...args) {
      const body = args.length > 1 ? args[1] : args[0];
      const todo = {
        completed: false,
        userId: '1',
        ...body,
        id: uuid(),
      };
      this.todos.push(todo);
      const user = this.users.find(item => item.id === '1');
      if (user) {
        user.todoCount = this.todos.filter(item => item.userId === '1').length;
      }
      return {
        todo,
        user: user ? { ...user } : { id: '1', todoCount: 0 },
      };
    },
    delay: 150,
  },
];
