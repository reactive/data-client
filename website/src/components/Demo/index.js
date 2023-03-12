import { GQLEndpoint } from '@rest-hooks/graphql';
import clsx from 'clsx';
import React from 'react';
import { Link } from 'react-router-dom';

import simpleFetchDemo from './code/simple';
import appDemo from './code/todo-app';
import CodeEditor from './CodeEditor';
import styles from './styles.module.css';
import { TODOS } from '../../mocks/handlers';

const mutationDemo = [
  {
    label: 'REST',
    value: 'rest',
    code: [
      {
        path: 'api',
        code: `export class Todo extends Entity {
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
      },
      {
        path: 'react',
        open: true,
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
    ],
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
        response({ id }) {
          return { todo: this[id] };
        },
        delay: 150,
      },
      {
        endpoint: new GQLEndpoint('/').mutation(
          `mutation UpdateTodo($todo: Todo!) {
          updateTodo(todo: $todo) {
            id
            title
            completed
          }
        }`,
        ),
        response({ todo }) {
          const pk = todo.id;
          this[pk] = { ...this[pk], ...todo };
          return { updateTodo: this[pk] };
        },
        delay: 150,
      },
    ],
    getInitialInterceptorData: () =>
      Object.fromEntries(
        TODOS.map(todo => [todo.id, { ...todo, updatedAt: Date.now() }]),
      ),
    code: [
      {
        path: 'api',
        code: `import { GQLEndpoint, GQLEntity } from '@rest-hooks/graphql';

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
      },
      {
        path: 'react',
        open: true,
        code: `import { TodoResource } from './api';

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
    ],
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
