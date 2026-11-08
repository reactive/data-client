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

/** Optimistically sets the Todo to the request body */
export function makeUpdateTodo(
  sendUpdate: (body: TodoItem) => Promise<TodoItem>,
) {
  return new Endpoint(sendUpdate, {
    schema: Todo,
    sideEffect: true,
    name: 'updateTodo',
    getOptimisticResponse: (_snap, body: TodoItem) => body,
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
