import React from 'react';
import clsx from 'clsx';
import { Link } from '@docusaurus/router';
import TodoResource from 'todo-app/src/resources/TodoResource';

import CodeEditor from './CodeEditor';
import styles from './styles.module.css';

const simpleFetchDemo = [
  {
    label: 'Fetch',
    value: 'fetch',
    code:
      `const fetchTodoDetail = async ({ id }) =>
  (await fetch(\`https://jsonplaceholder.typicode.com/todos/\${id}\`)).json()
const todoDetail = new Endpoint(fetchTodoDetail);` +
      '\n\n' +
      `function TodoDetail() {
  const todo = useResource(todoDetail, { id: 1 });
  return <div>{todo.title}</div>;
}
render(<TodoDetail/>);
`,
  },
  {
    label: 'REST',
    value: 'rest',
    code:
      `class TodoResource extends Resource {
    pk() { return this.id }
    static urlRoot = 'https://jsonplaceholder.typicode.com/todos';
  }` +
      '\n\n' +
      `function TodoDetail() {
  const todo = useResource(TodoResource.detail(), { id: 1 });
  return <div>{todo.title}</div>;
}
render(<TodoDetail/>);
`,
  },
  {
    label: 'GraphQL',
    value: 'graphql',
    code:
      `const gql = new GQLEndpoint('https://nosy-baritone.glitch.me');
  const userDetail = gql.query(\`
    query UserDetail($name: String!) {
      user(name: $name) {
        id
        name
        email
      }
    }
  \`);` +
      '\n\n' +
      `function UserDetail() {
    const { user } = useResource(userDetail, { name: 'Fong' });
    return <div>{user.email}</div>;
  }
  render(<UserDetail/>);
  `,
  },
];

const mutationDemo = [
  {
    label: 'REST',
    value: 'rest',
    code: `function TodoDetail({ id }) {
  const todo = useResource(TodoResource.detail(), { id });
  const controller = useController();
  const updateWith = title => () =>
    controller.fetch(
      TodoResource.partialUpdate(),
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
  /*{
    label: 'GraphQL',
    value: 'graphql',
    code:
      `const gql = new GQLEndpoint(
  'https://swapi-graphql.netlify.app/.netlify/functions/index',
);

class Review extends GQLEntity {
  readonly stars: number = 0;
  readonly commentary: string = '';
}

const createReview = gql.mutation(
  \`mutation CreateReviewForEpisode($ep: Episode!, $review: ReviewInput!) {
    createReview(episode: $ep, review: $review) {
      stars
      commentary
    }
  }\`,
  { createReview: Review },
);` +
      '\n\n' +
      `function NewReviewForm() {
  const { fetch } = useController();
  return (
    <form onSubmit={e => {e.preventDefault();fetch(createReview, new FormData(e.target))}}>
      <input name="ep" />
      <input name="review" type="compound" />
      <input type="submit" value="submit" />
    </form>
  );
}
render(<NewReviewForm/>);
  `,
  },*/
];

const appDemo = [
  {
    label: 'REST',
    value: 'rest',
    code: `function TodoItem({ todo }: { todo: TodoResource }) {
  const controller = useController();
  return (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={e =>
          controller.fetch(
            TodoResource.partialUpdate(),
            { id: todo.id },
            { completed: e.currentTarget.checked },
          )
        }
      />
      {todo.completed ? <strike>{todo.title}</strike> : todo.title}
    </div>
  );
}

function TodoList() {
  const todos = useResource(TodoResource.list(), {});
  const controller = useController();
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
            Add a single{' '}
            <Link to="/docs/getting-started/data-dependency">
              useResource()
            </Link>{' '}
            call where you need its data.
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
        <CodeEditor codes={simpleFetchDemo} />
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
        <CodeEditor codes={mutationDemo} />
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
        <CodeEditor codes={appDemo} />
      </div>
    </div>
  </div>
);
export default Demo;
