import { GQLEndpoint } from '@rest-hooks/graphql';
import clsx from 'clsx';
import React from 'react';
import { Link } from 'react-router-dom';

import CodeEditor from './CodeEditor';
import styles from './styles.module.css';
import { TODOS } from '../../mocks/handlers';

const simpleFetchDemo = [
  {
    label: 'Fetch',
    value: 'fetch',
    autoFocus: true,

    code: {
      api: `export const getTodo = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
});`,
      react: `import { getTodo } from './api';

function TodoDetail({ id }: { id: number }) {
  const todo = useSuspense(getTodo, { id });
  return <div>{todo.title}</div>;
}
render(<TodoDetail id={1} />);
`,
    },
  },
  {
    label: 'REST',
    value: 'rest',
    autoFocus: true,
    code: {
      api: `export class Todo extends Entity {
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
      react: `import { TodoResource } from './api';

function TodoDetail({ id }: { id: number }) {
  const todo = useSuspense(TodoResource.get, { id });
  return <div>{todo.title}</div>;
}
render(<TodoDetail id={1} />);
`,
    },
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
    code: {
      api: `import { GQLEndpoint } from '@rest-hooks/graphql';

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
      react: `import { getTodo } from './api';

function TodoDetail({ id }: { id: number }) {
  const { todo } = useSuspense(getTodo, { id });
  return <div>{todo.title}</div>;
}
render(<TodoDetail id={1} />);
`,
    },
  },
];

const mutationDemo = [
  {
    label: 'REST',
    value: 'rest',
    code: {
      api: `export class Todo extends Entity {
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
    getOptimisticResponse(snap, { id }, body) {
      return {
        id,
        ...body,
      };
    },
  }),
};`,
      react: `import { TodoResource } from './api';

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
    code: {
      api: `import { GQLEndpoint, GQLEntity } from '@rest-hooks/graphql';

const gql = new GQLEndpoint('/');

export class Todo extends GQLEntity {
  readonly title: string = '';
  readonly completed: boolean = false;
}

export const TodoResource = {
  get: gql.query(\`
    query GetTodo($id: ID!) {
      todo(id: $id) {
        id
        title
        completed
      }
    }
  \`, { todo: Todo }),
  update: gql.mutation(
    \`mutation UpdateTodo($todo: Todo!) {
      updateTodo(todo: $todo) {
        id
        title
        completed
      }
    }\`,
    { updateTodo: Todo },
  ),
}`,
      react: `import { TodoResource } from './api';

function TodoDetail({ id }: { id: number }) {
  const { todo } = useSuspense(TodoResource.get, { id });
  const controller = useController();
  const updateWith = title => () =>
    controller.fetch(
      TodoResource.update,
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
  },
];

const appDemo = [
  {
    label: 'REST',
    value: 'rest',
    code: {
      api: `export class Todo extends Entity {
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
      // for demo purposes we'll only use the first seven
      return todos.slice(0, 7);
    },
  }),
  partialUpdate: BaseTodoResource.partialUpdate.extend({
    getOptimisticResponse(snap, { id }, body) {
      return {
        id,
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
      TodoItem: `import { TodoResource, type Todo } from './api';

export default function TodoItem({ todo }: { todo: Todo }) {
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
`,
      TodoList: `import { TodoResource } from './api';
import TodoItem from './TodoItem';

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
    code: {
      api: `import { GQLEndpoint, GQLEntity } from '@rest-hooks/graphql';

const gql = new GQLEndpoint('/');

export class Todo extends GQLEntity {
  readonly title: string = '';
  readonly completed: boolean = false;
}

export const TodoResource = {
  get: gql.query(\`
    query GetTodo($id: ID!) {
      todo(id: $id) {
        id
        title
        completed
      }
    }
  \`, { todo: Todo }),
  getList: gql.query(\`
    query GetTodos {
      todo {
        id
        title
        completed
      }
    }
  \`, { todos: [Todo] }),
  update: gql.mutation(
    \`mutation UpdateTodo($todo: Todo!) {
      updateTodo(todo: $todo) {
        id
        title
        completed
      }
    }\`,
    { updateTodo: Todo },
  ),
};`,
      TodoItem: `import { TodoResource, type Todo } from './api';

export default function TodoItem({ todo }: { todo: Todo }) {
  const controller = useController();
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={e =>
            controller.fetch(TodoResource.update, {
              todo: { id: todo.id, completed: e.currentTarget.checked },
            })
          }
        />
        {todo.completed ? <strike>{todo.title}</strike> : todo.title}
      </label>
    </div>
  );
}
`,
      TodoList: `import { TodoResource } from './api';
import TodoItem from './TodoItem';

function TodoList() {
  const { todos } = useSuspense(TodoResource.getList, {});
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
            This updates <strong>all</strong> usages{' '}
            <Link to="/docs/concepts/atomic-mutations">
              <em>atomically</em> and <em>immediately</em>
            </Link>{' '}
            with zero additional fetches. Rest Hooks automatically ensures data
            consistency and integrity globally.
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
            <Link to="/docs/concepts/normalization">data normalization</Link> to
            maintain consistency no matter how and where the data is consumed.
          </p>
          <p>
            Every piece of data maintains referential stability unless it
            changes. This ensures the most optimized render performance, as well
            as predictable equality checks.
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
