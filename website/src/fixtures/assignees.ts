import type { Interceptor } from '@data-client/test';

import { TodoResource, UserResource } from './todos';

// jsonplaceholder's shapes, with people and tasks that read like a real team
const users = [
  { id: 1, name: 'Maya Chen', username: 'maya', email: 'maya@example.com' },
  { id: 2, name: 'Leo Fischer', username: 'leo', email: 'leo@example.com' },
  { id: 3, name: 'Ama Owusu', username: 'ama', email: 'ama@example.com' },
  { id: 4, name: 'Ravi Kumar', username: 'ravi', email: 'ravi@example.com' },
];
const todos = {
  1: { id: 1, userId: 1, title: 'Launch post', completed: false },
  2: { id: 2, userId: 2, title: 'Pricing page review', completed: true },
  3: { id: 3, userId: 3, title: 'Fix signup bug', completed: false },
  4: { id: 4, userId: 1, title: 'Onboarding demo', completed: false },
  5: { id: 5, userId: 4, title: 'API changelog', completed: false },
  6: { id: 6, userId: 2, title: 'Sprint planning', completed: false },
};
type AssigneeState = {
  todos: Record<string, (typeof todos)[keyof typeof todos]>;
};

export const getInitialInterceptorData = (): AssigneeState => ({
  todos: structuredClone(todos),
});

export const assigneeFixtures: Interceptor<AssigneeState>[] = [
  {
    endpoint: TodoResource.getList,
    response() {
      return Object.values(this.todos);
    },
    delay: 150,
  },
  {
    endpoint: UserResource.getList,
    response() {
      return users;
    },
    delay: 250,
  },
  {
    endpoint: TodoResource.partialUpdate,
    response(
      { id }: Parameters<typeof TodoResource.partialUpdate>[0],
      body: Parameters<typeof TodoResource.partialUpdate>[1],
    ) {
      this.todos[id] = { ...this.todos[id], ...body };
      return this.todos[id];
    },
    delay: 300,
  },
];
