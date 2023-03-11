import { graphql } from 'msw';

const pageInitAt = Date.now();

export let TODOS = [
  {
    userId: 1,
    id: 1,
    title: 'delectus aut autem',
    completed: false,
  },
  {
    userId: 1,
    id: 2,
    title: 'quis ut nam facilis et officia qui',
    completed: false,
  },
  {
    userId: 1,
    id: 3,
    title: 'fugiat veniam minus',
    completed: false,
  },
  {
    userId: 1,
    id: 4,
    title: 'et porro tempora',
    completed: true,
  },
  {
    userId: 1,
    id: 5,
    title: 'laboriosam mollitia et enim quasi adipisci quia provident illum',
    completed: false,
  },
].map(todo => ({ ...todo, updatedAt: pageInitAt }));

export const handlers = [
  graphql.query('GetTodos', (req, res, ctx) => {
    return res(ctx.delay(150), ctx.data({ todos: TODOS }));
  }),

  graphql.query('GetTodo', (req, res, ctx) => {
    const { id } = req.variables;
    return res(
      ctx.delay(150),
      ctx.data({ todo: TODOS.find(todo => todo.id === id) }),
    );
  }),

  graphql.mutation('UpdateTodo', (req, res, ctx) => {
    const { todo } = req.variables;
    const id = todo.id;
    const oldTodo = TODOS.find(todo => todo.id === id);
    const newTodo = {
      ...oldTodo,
      ...todo,
    };
    return res(ctx.data({ updateTodo: newTodo }));
  }),
];
