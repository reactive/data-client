import {
  GQLEndpoint,
  GQLEntity,
  Query,
  All,
} from '@data-client/graphql';

const gql = new GQLEndpoint('/');

export class Todo extends GQLEntity {
  readonly title: string = '';
  readonly completed: boolean = false;
  readonly userId: number = 0;
}

export const TodoResource = {
  get: gql.query(
    `query GetTodo($id: ID!) {
    todo(id: $id) {
      id
      title
      completed
      userId
    }
  }
`,
    { todo: Todo },
  ),
  getList: gql.query(
    `query GetTodos {
    todo {
      id
      title
      completed
      userId
    }
  }
`,
    { todos: [Todo] },
  ),
  update: gql.mutation(
    `mutation UpdateTodo($todo: Todo!) {
    updateTodo(todo: $todo) {
      id
      title
      completed
    }
  }`,
    { updateTodo: Todo },
  ),
  queryRemaining: new Query(
    new All(Todo),
    (entries, { userId } = {}) => {
      if (userId !== undefined)
        return entries.filter(
          todo => todo.userId === userId && !todo.completed,
        ).length;
      return entries.filter(todo => !todo.completed).length;
    },
  ),
};
