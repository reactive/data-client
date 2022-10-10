import { rest, graphql } from 'msw';

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

let MAX_ID = TODOS.reduce((todo, prev) => Math.max(todo.id, prev), 0);

let simulatedServerStateCount = 0;

export const handlers = [
  // todos
  rest.get('/api/todos', (req, res, ctx) => {
    return res(ctx.status(200), ctx.delay(150), ctx.json(TODOS));
  }),
  rest.get('/api/todos/:id', (req, res, ctx) => {
    const { id } = req.params;
    const todo = TODOS.find(todo => todo.id == id);
    if (!todo) return res(ctx.status(404), ctx.delay(150));
    return res(ctx.status(200), ctx.delay(150), ctx.json(todo));
  }),
  rest.patch('/api/todos/:id', (req, res, ctx) => {
    const { id } = req.params;
    const i = TODOS.findIndex(todo => todo.id == id);
    if (i < 0) return res(ctx.status(404), ctx.delay(150));
    TODOS[i] = { ...TODOS[i], updatedAt: Date.now(), ...req.body };
    return res(ctx.status(200), ctx.delay(150), ctx.json(TODOS[i]));
  }),
  rest.post('/api/todos', (req, res, ctx) => {
    TODOS.push({ id: MAX_ID++, updatedAt: Date.now(), ...req.body });
    return res(
      ctx.status(201),
      ctx.delay(150),
      ctx.json(TODOS[TODOS.length - 1]),
    );
  }),
  rest.delete('/api/todos/:id', (req, res, ctx) => {
    const { id } = req.params;
    const i = TODOS.findIndex(todo => todo.id == id);
    if (i < 0) return res(ctx.status(204), ctx.delay(150));
    TODOS = TODOS.slice(0, i).concat(TODOS.slice(i + 1));
    return res(ctx.status(200), ctx.delay(150), ctx.json(''));
  }),

  rest.get('/api/currentTime/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.delay(150),
      ctx.json({
        id,
        updatedAt: new Date().toISOString(),
      }),
    );
  }),

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

  // optimistic updates
  rest.get('/api/count', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.delay(150),
      ctx.json({ count: simulatedServerStateCount, updatedAt: pageInitAt }),
    );
  }),
  rest.post('/api/count/increment', (req, res, ctx) => {
    return res(
      ctx.status(200),
      // resolve from 500ms -> 5 seconds. Represents network variance.
      // making state computed before hand allows demonstrating out of order race conditions
      ctx.delay(500 + Math.random() * 4500),
      ctx.json({
        count: ++simulatedServerStateCount,
        updatedAt: req.body.updatedAt,
      }),
    );
  }),
];
