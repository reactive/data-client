import React from 'react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { GQLEndpoint } from '@rest-hooks/graphql';

import { TODOS } from '../../mocks/handlers';
import CodeEditor from './CodeEditor';
import styles from './styles.module.css';

const simpleFetchDemo = [
  {
    label: 'Fetch',
    value: 'fetch',
    autoFocus: true,

    endpointCode: `export const getTodo = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
});`,
    code: `import { getTodo } from './api';

function TodoDetail({ id }: { id: number }) {
  const todo = useSuspense(getTodo, { id });
  return <div>{todo.title}</div>;
}
render(<TodoDetail id={1} />);
`,
  },
  {
    label: 'REST',
    value: 'rest',
    autoFocus: true,
    endpointCode: `export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
  pk() { return \`\${this.id}\` }
}
export const TodoResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
})`,
    code: `import { TodoResource } from './api';

function TodoDetail({ id }: { id: number }) {
  const todo = useSuspense(TodoResource.get, { id });
  return <div>{todo.title}</div>;
}
render(<TodoDetail id={1} />);
`,
  },
  {
    label: 'GraphQL',
    value: 'graphql',
    autoFocus: true,

    fixtures: [
      {
        endpoint: new GQLEndpoint('/').query(`
  query GetTodo($id: ID!) {
    todo(id: $id) {
      id
      title
      completed
    }
  }
`),
        args: [{ id: 1 }],
        response: { todo: TODOS.find(todo => todo.id === 1) },
        delay: 150,
      },
    ],
    endpointCode: `import { GQLEndpoint } from '@rest-hooks/graphql';

const gql = new GQLEndpoint('/');
export const getTodo = gql.query(\`
  query GetTodo($id: ID!) {
    todo(id: $id) {
      id
      title
      completed
    }
  }
\`);`,
    code: `import { getTodo } from './api';

function TodoDetail({ id }: { id: number }) {
  const { todo } = useSuspense(getTodo, { id });
  return <div>{todo.title}</div>;
}
render(<TodoDetail id={1} />);
`,
  },
];

const mutationDemo = [
  {
    label: 'REST',
    value: 'rest',
    endpointCode: `export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
  pk() { return \`\${this.id}\` }
}
const BaseTodoResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
});
export const TodoResource = {
  ...BaseTodoResource,
  partialUpdate: BaseTodoResource.partialUpdate.extend({
    getOptimisticResponse(snap, params, body) {
      return {
        id: params.id,
        ...body,
      };
    },
  }),
};`,
    code: `import { TodoResource } from './api';

function TodoDetail({ id }: { id: number }) {
  const todo = useSuspense(TodoResource.get, { id });
  const controller = useController();
  const updateWith = title => () =>
    controller.fetch(
      TodoResource.partialUpdate,
      { id },
      { title }
    );
  return (
    <div>
      <div>{todo.title}</div>
      <button onClick={updateWith('🥑')}>🥑</button>
      <button onClick={updateWith('💖')}>💖</button>
    </div>
  );
}
render(<TodoDetail id={1} />);
`,
  },
  {
    label: 'GraphQL',
    value: 'graphql',
    fixtures: [
      {
        endpoint: new GQLEndpoint('/').query(`
  query GetTodo($id: ID!) {
    todo(id: $id) {
      id
      title
      completed
    }
  }
`),
        args: [{ id: 1 }],
        response: { todo: TODOS.find(todo => todo.id === 1) },
        delay: 150,
      },
    ],
    endpointCode: `import { GQLEndpoint, GQLEntity } from '@rest-hooks/graphql';

const gql = new GQLEndpoint('/');

export class Todo extends GQLEntity {
  readonly title: string = '';
  readonly completed: boolean = false;
}

export const getTodo = gql.query(\`
  query GetTodo($id: ID!) {
    todo(id: $id) {
      id
      title
      completed
    }
  }
\`, { todo: Todo });

export const updateTodo = gql.mutation(
  \`mutation UpdateTodo($todo: Todo!) {
    updateTodo(todo: $todo) {
      id
      title
      completed
    }
  }\`,
  { updateTodo: Todo },
);`,
    code: `import { getTodo, updateTodo } from './api';

function TodoDetail({ id }: { id: number }) {
  const { todo } = useSuspense(getTodo, { id });
  const controller = useController();
  const updateWith = title => () =>
    controller.fetch(
      updateTodo,
      { todo: { id, title } }
    );
  return (
    <div>
      <div>{todo.title}</div>
      <button onClick={updateWith('🥑')}>🥑</button>
      <button onClick={updateWith('💖')}>💖</button>
    </div>
  );
}
render(<TodoDetail id={1} />);
  `,
  },
];

const appDemo = [
  {
    label: 'REST',
    value: 'rest',
    endpointCode: `export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
  pk() { return \`\${this.id}\` }
}
const BaseTodoResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
});
export const TodoResource = {
  ...BaseTodoResource,
  getList: BaseTodoResource.getList.extend({
    process(todos) {
      return todos.slice(0, 7);
    },
  }),
  partialUpdate: BaseTodoResource.partialUpdate.extend({
    getOptimisticResponse(snap, params, body) {
      return {
        id: params.id,
        ...body,
      };
    },
  }),
  delete: BaseTodoResource.delete.extend({
    getOptimisticResponse(snap, params) {
      return params;
    },
  }),
};`,
    code: `import { TodoResource, Todo } from './api';

function TodoItem({ todo }: { todo: Todo }) {
  const controller = useController();
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={e =>
            controller.fetch(
              TodoResource.partialUpdate,
              { id: todo.id },
              { completed: e.currentTarget.checked },
            )
          }
        />
        {todo.completed ? (
          <strike>{todo.title}</strike>
        ) : (
          todo.title
        )}
      </label>
      <span
        style={{ cursor: 'pointer' }}
        onClick={() =>
          controller.fetch(TodoResource.delete, {
            id: todo.id,
          })
        }
      >
        ❌
      </span>
    </div>
  );
}

function TodoList() {
  const todos = useSuspense(TodoResource.getList);
  return (
    <div>
      {todos.map(todo => (
        <TodoItem key={todo.pk()} todo={todo} />
      ))}
    </div>
  );
}
render(<TodoList />);
`,
  },
  {
    label: 'GraphQL',
    value: 'graphql',
    fixtures: [
      {
        endpoint: new GQLEndpoint('/').query(`
  query GetTodos {
    todo {
      id
      title
      completed
    }
  }
`),
        args: [{}],
        response: { todos: TODOS },
        delay: 150,
      },
    ],
    endpointCode: `import { GQLEndpoint, GQLEntity } from '@rest-hooks/graphql';

const gql = new GQLEndpoint('/');

export class Todo extends GQLEntity {
  readonly title: string = '';
  readonly completed: boolean = false;
}

export const todoList = gql.query(\`
  query GetTodos {
    todo {
      id
      title
      completed
    }
  }
\`, { todos: [Todo] });

export const updateTodo = gql.mutation(
  \`mutation UpdateTodo($todo: Todo!) {
    updateTodo(todo: $todo) {
      id
      title
      completed
    }
  }\`,
  { updateTodo: Todo },
);`,
    code: `import { todoList, updateTodo, Todo } from './api';

function TodoItem({ todo }: { todo: Todo }) {
  const controller = useController();
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={e =>
            controller.fetch(updateTodo, {
              todo: { id: todo.id, completed: e.currentTarget.checked },
            })
          }
        />
        {todo.completed ? <strike>{todo.title}</strike> : todo.title}
      </label>
    </div>
  );
}

function TodoList() {
  const { todos } = useSuspense(todoList, {});
  return (
    <div>
      {todos.map(todo => (
        <TodoItem key={todo.pk()} todo={todo} />
      ))}
    </div>
  );
}
render(<TodoList />);
`,
  },
];

const Demo = props => (
  <div className="container">
    <div className={clsx('row', styles.demoList)}>
      <div className="col col--3">
        <h2>A simple data fetch</h2>
        <div>
          <p>
            Add a single <Link to="/docs/api/useSuspense">useSuspense()</Link>{' '}
            call{' '}
            <Link to="/docs/getting-started/data-dependency">
              where you need its data
            </Link>
            .
          </p>
          <p>
            Rest Hooks automatically optimizes performance by caching the
            results, deduplicating fetches, efficient component render bindings
            and more.
          </p>
          {/*<p>
            Decoupling <em>how</em> to get data from <em>where</em> you use it
            enables reusable components.
          </p>*/}
        </div>
      </div>
      <div className="col col--9">
        <CodeEditor codes={simpleFetchDemo} defaultValue="rest" />
      </div>
    </div>
    <div className={clsx('row', styles.demoList)}>
      <div className="col col--3">
        <h2>Stateful mutations</h2>
        <div>
          <p>
            Use <Link to="/docs/api/Controller#fetch">Controller.fetch()</Link>{' '}
            to update the store.
          </p>
          <p>
            Rest Hooks ensures data consistency and integrity globally. Every
            piece of data maintains referential stability unless it changes.
            This ensures the most optimized render performance, as well as
            predictable equality checks.
          </p>
        </div>
      </div>
      <div className="col col--9">
        <CodeEditor codes={mutationDemo} defaultValue="rest" />
      </div>
    </div>
    <div className={clsx('row', styles.demoList)}>
      <div className="col col--3">
        <h2>An application</h2>
        <div>
          <p>
            Data can be consumed and controlled in many contexts, speeding up
            development.
          </p>
          <p>
            Rest Hooks uses{' '}
            <Link to="/docs/getting-started/entity">data normalization</Link> to
            maintain consistency no matter how and where the data is consumed.
          </p>
          <p>
            Rest easy with the help of{' '}
            <Link to="/docs/guides/debugging">debugging</Link>,{' '}
            <Link to="/docs/guides/unit-testing-hooks">unit testing</Link>, and{' '}
            <Link to="/docs/guides/storybook">storybook integration</Link>.
          </p>
        </div>
      </div>
      <div className="col col--9">
        <CodeEditor codes={appDemo} defaultValue="rest" />
      </div>
    </div>
  </div>
);
export default Demo;
