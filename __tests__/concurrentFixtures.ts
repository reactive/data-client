import { Endpoint, Entity } from '@data-client/endpoint';
import { mockInitialState } from '@data-client/test';

export class Todo extends Entity {
  id = '';
  title = '';
}

export type TodoItem = { id: string; title: string };

export function makeGetTodo(
  fetchTodo: (args: { id: string }) => Promise<TodoItem>,
  extra?: { pollFrequency?: number },
) {
  return new Endpoint(fetchTodo, {
    schema: Todo,
    name: 'getTodo',
    ...extra,
  });
}

export function mockTodoState(
  getTodo: ReturnType<typeof makeGetTodo>,
  ids: readonly string[],
) {
  return mockInitialState(
    ids.map(id => ({
      endpoint: getTodo,
      args: [{ id }],
      response: { id, title: `todo ${id}` },
    })),
  );
}
