import { Endpoint, Entity } from '../index';

class Todo extends Entity {
  id = '';
  title = '';
  completed = false;
}
class User extends Entity {
  id = '';
  username = '';
  admin = false;
}
const updateTodo = new Endpoint(
  (params: { id: string }, body: Partial<Todo>): Promise<any> =>
    Promise.resolve({ ...body, ...params }),
  { schema: Todo, sideEffect: true },
);

it('getOptimisticResponse() returns raw input for the schema', () => {
  new Endpoint((params: { id: string }) => Promise.resolve(params as any), {
    schema: Todo,
    // @ts-expect-error completed is a boolean
    getOptimisticResponse(snap, { id }) {
      return { id, completed: 'false' };
    },
  });
  updateTodo.extend({
    getOptimisticResponse(snap, { id }, body) {
      return { ...body, id, completed: true };
    },
  });
  updateTodo.extend({
    // @ts-expect-error completed is a boolean
    getOptimisticResponse(snap, { id }) {
      return { id, completed: 'false' };
    },
  });
  // overridden schema is used
  updateTodo.extend({
    schema: User,
    getOptimisticResponse(snap, { id }) {
      return { id, username: 'bob', admin: true };
    },
  });
  updateTodo.extend({
    schema: User,
    // @ts-expect-error admin is a boolean
    getOptimisticResponse(snap, { id }) {
      return { id, admin: 'yes' };
    },
  });
  // no schema: anything goes
  new Endpoint(() => Promise.resolve({} as any), {
    schema: null,
    getOptimisticResponse() {
      return { ok: true };
    },
  });
  updateTodo.extend({
    schema: null,
    getOptimisticResponse() {
      return { ok: true };
    },
  });
  updateTodo.extend({
    schema: undefined,
    getOptimisticResponse() {
      return { ok: true };
    },
  });
  expect(updateTodo.schema).toBe(Todo);
});
