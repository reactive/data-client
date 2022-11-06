---
title: Introduction
slug: /
---

<head>
  <title>Rest Hooks Introduction - Asynchronous Data for React ✨</title>
</head>

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import ProtocolTabs from '@site/src/components/ProtocolTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';

Rest Hooks is an asynchronous data framework for TypeScript and JavaScript. While it is completely protocol and platform agnostic,
it is not a networking stack for things like minecraft game servers.

A good way to tell if this could be useful is if you use something similar to **any** of the following to build data-driven applications:

- API protocols like [REST](/rest), [GraphQL](/graphql), [gRPC](https://grpc.io/), [JSON:API](https://jsonapi.org/)
- Transport protocols like [HTTP](/rest/api/RestEndpoint), [WebSockets](./api/Manager.md#middleware-data-stream), [local](/rest/guides/mocking-unfinished)
- Async storage engines like [IndexedDb](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [AsyncStorage](https://reactnative.dev/docs/asyncstorage)

Rest Hooks focuses on solving the following challenges in a declarative composable manner

- **Asynchronous** behavior and race conditions
- Global <strong>consistency and integrity</strong> of <abbr title="changing">dynamic</abbr> data
- High **performance** at scale

## Endpoint

[Endpoints](./getting-started/endpoint.md) make it easy to share and reuse strongly typed [APIs](https://www.freecodecamp.org/news/what-is-an-api-in-english-please-b880a3214a82/)

[Protocol implementations](#protocol-specific-patterns) make definitions a breeze by building off the basic
[Endpoint](/rest/api/Endpoint). For protocols not shipped here, feel free to extend Endpoint directly.

<ProtocolTabs>

```ts
import { RestEndpoint } from '@rest-hooks/rest';

const getTodo = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
});
```

```ts
import { GQLEndpoint } from '@rest-hooks/graphql';

const gql = new GQLEndpoint('/');
export const getTodo = gql.query(`
  query GetTodo($id: ID!) {
    todo(id: $id) {
      id
      title
      completed
    }
  }
`);
```

</ProtocolTabs>

By _decoupling_ endpoint definitions from their usage, we are able to reuse them in many contexts.

- Easy reuse in different **components** eases co-locating data dependencies
- Reuse with different **hooks** allows different behaviors with the same endpoint
- Reuse across different **platforms** like React Native, React web, or even beyond React in Angular, Svelte, Vue, or Node
- Published as **packages** independent of their consumption

## Co-locate data dependencies

Bind the data [where you need it](./getting-started/data-dependency.md) with the one-line [useSuspense()](./api/useSuspense.md)

```tsx {4}
import { useSuspense } from 'rest-hooks';

export default function TodoDetail({ id }: { id: number }) {
  const todo = useSuspense(getTodo, { id });

  return <div>{todo.title}</div>;
}
render(<TodoDetail id={1} />);
```

- Avoid prop drilling
- Data updates only re-render components that need to

## Async Fallbacks with Boundaries

Unify and reuse [loading and error fallbacks](./getting-started/data-dependency.md#async-fallbacks) with [Suspense](https://reactjs.org/docs/concurrent-mode-suspense.html) and [NetworkErrorBoundary](./api/NetworkErrorBoundary.md)

```tsx {6-7,10-11}
import { Suspense } from 'react';
import { NetworkErrorBoundary } from 'rest-hooks';

function App() {
  return (
    <Suspense fallback="loading">
      <NetworkErrorBoundary>
        <AnotherRoute />
        <TodoDetail id={5} />
      </NetworkErrorBoundary>
    </Suspense>
  );
}
```

[Non-Suspense fallback handling](./getting-started/data-dependency.md#stateful) can also be used for certain
cases in React 16 and 17

## Mutations

<details><summary><b>todoUpdate</b></summary>

<LanguageTabs>

```typescript
import { Endpoint } from '@rest-hooks/endpoint';

interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}
interface Params {
  id: number;
}

const fetchTodoUpdate = ({ id }: Params, body: FormData): Promise<Todo> =>
  fetch('https://jsonplaceholder.typicode.com/todos', {
    method: 'PATCH',
    body,
  }).then(res => res.json());

const todoUpdate = new Endpoint(fetchTodoUpdate, { sideEffect: true });
```

```js
import { Endpoint } from '@rest-hooks/endpoint';

const fetchTodoUpdate = ({ id }, body) =>
  fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
    method: 'PATCH',
    body,
  }).then(res => res.json());

const todoUpdate = new Endpoint(fetchTodoUpdate, { sideEffect: true });
```

</LanguageTabs>

</details>

Instead of just calling the `todoUpdate` endpoint with our data, we want to ensure
**all** co-located usages of the todo being edited are updated. This avoid both the complexity and performance
problems of attempting to cascade endpoint refreshes.

[useController](./api/useController.md) gives us access to the Rest Hooks [Controller](./api/Controller.md), which
is used to trigger imperative actions like [fetch](./api/Controller.md#fetch).

```tsx
import { useController } from 'rest-hooks';

const { fetch } = useController();
return <ArticleForm onSubmit={data => fetch(todoUpdate, { id }, data)} />;
```

<details><summary><b>Tracking imperative loading/error state</b></summary>

[useLoading()](./api/useLoading.md) enhances async functions by tracking their loading and error states.

```tsx
import { useLoading } from '@rest-hooks/hooks';

const { fetch } = useController();
// highlight-next-line
const [update, loading, error] = useLoading(
  data => fetch(todoUpdate, { id }, data),
  [fetch],
);
return <ArticleForm onSubmit={update} />;
```

</details>

However, there is still one issue. Our `todoUpdate` and `todoDetail` endpoint are not aware of each other
so how can Rest Hooks know to update todoDetail with this data?

### Entities

Adding [Entities](./getting-started/entity.md#entities) to our endpoint definition tells Rest Hooks
how to extract and find a given piece of data no matter where it is used. The [pk()](/rest/api/Entity#pk) (primary key)
method is used as a key in a lookup table.

This enables a [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) storage pattern, which
prevents 'data tearing' jank and improves performance.

<Tabs
defaultValue="Entity"
values={[
{ label: 'Entity', value: 'Entity' },
{ label: 'todoDetail', value: 'todoDetail' },
{ label: 'todoUpdate', value: 'todoUpdate' },
]}>
<TabItem value="Entity">

```ts
import { Entity } from '@rest-hooks/endpoint';

export class Todo extends Entity {
  readonly userId: number = 0;
  readonly id: number = 0;
  readonly title: string = '';
  readonly completed: boolean = false;

  pk() {
    return `${this.id}`;
  }
}
```

</TabItem>
<TabItem value="todoDetail">

```typescript {13}
import { Endpoint } from '@rest-hooks/endpoint';

interface Params {
  id: number;
}

const fetchTodoDetail = ({ id }: Params) =>
  fetch(`https://jsonplaceholder.typicode.com/todos/${id}`).then(res =>
    res.json(),
  );

const todoDetail = new Endpoint(fetchTodoDetail, {
  schema: Todo,
  sideEffect: true,
});
```

</TabItem>
<TabItem value="todoUpdate">

```typescript {14}
import { Endpoint } from '@rest-hooks/endpoint';

interface Params {
  id: number;
}

const fetchTodoUpdate = ({ id }: Params, body: FormData) =>
  fetch('https://jsonplaceholder.typicode.com/todos', {
    method: 'PATCH',
    body,
  }).then(res => res.json());

const todoUpdate = new Endpoint(fetchTodoUpdate, {
  schema: Todo,
  sideEffect: true,
});
```

</TabItem>
</Tabs>

### Schema

What if our entity is not the top level item? Here we define the `todoList`
endpoint with `[Todo]` as its schema. [Schemas](./getting-started/entity.md) tell Rest Hooks _where_ to find
the Entities. By placing inside a list, Rest Hooks knows to expect a response
where each item of the list is the entity specified.

```typescript {7}
import { Endpoint } from '@rest-hooks/endpoint';

const fetchTodoList = (params: any) =>
  fetch(`https://jsonplaceholder.typicode.com/todos/`).then(res => res.json());

const todoList = new Endpoint(fetchTodoList, {
  schema: [Todo],
  sideEffect: true,
});
```

[Schemas](./getting-started/entity.md) also automatically infer and enforce the response type, ensuring
the variable `todos` will be typed precisely. If the API responds in another manner
the hook with throw instead, triggering the `error fallback` specified in [<NetworkErrorBoundary /\>](./api/NetworkErrorBoundary.md)

```tsx {4}
import { useSuspense } from 'rest-hooks';

export default function TodoListComponent() {
  const todos = useSuspense(todoList, {});

  return (
    <div>
      {todos.map(todo => (
        <TodoListItem key={todo.pk()} todo={todo} />
      ))}
    </div>
  );
}
```

This also guarantees data consistency (as well as referential equality) between `todoList` and `todoDetail` endpoints, as well
as any mutations that occur.

### Optimistic Updates

By using the response of the mutation call to update the Rest Hooks store, we were able to
keep our components updated automatically and only after one request.

However, after toggling todo.completed, this is just too slow! No worries, [getOptimisticResponse](/rest/guides/optimistic-updates) tells
Rest Hooks what response it _expects_ to receive from the mutation call, Rest Hooks
can **immediately** update **all** components using the relevant entity.

```typescript
const getOptimisticResponse = (
  snap: SnapshotInterface,
  params: Params,
  body: FormData,
) => ({
  id: params.id,
  ...body,
});
todoUpdate = todoUpdate.extend({
  getOptimisticResponse,
});
```

Rest Hooks ensures data integrity against any possible networking failure or race condition, so don't
worry about network failures, multiple mutation calls editing the same data, or other common
problems in asynchronous programming.

<details><summary><b>todoUpdate</b></summary>

```typescript {16}
import { Endpoint, SnapshotInterface } from '@rest-hooks/endpoint';

interface Params {
  id: number;
}

const fetchTodoUpdate = ({ id }: Params, body: FormData) =>
  fetch('https://jsonplaceholder.typicode.com/todos', {
    method: 'PATCH',
    body,
  }).then(res => res.json());

const todoUpdate = new Endpoint(fetchTodoUpdate, {
  sideEffect: true,
  schema: Todo,
  getOptimisticResponse,
});

const getOptimisticResponse = (
  snap: SnapshotInterface,
  params: Params,
  body: FormData,
) => ({
  id: params.id,
  ...body,
});
```

</details>

## Protocol specific patterns

At this point we've defined `todoDetail`, `todoList` and `todoUpdate`. You might have noticed
that these endpoint definitions share some logic and information. For this reason Rest Hooks
encourages extracting shared logic among endpoints.

### @rest-hooks/rest

One common pattern is having endpoints Create Read Update Delete (CRUD) for a given resource.
Using [@rest-hooks/rest](https://www.npmjs.com/package/@rest-hooks/rest) ([docs](/rest)) simplifies these patterns.

[RestEndpoint](/rest/api/RestEndpoint) extends [Endpoint](/rest/api/Endpoint) simplifying HTTP patterns.

[createResource](/rest/api/createResource) takes this one step further by creating [6 Endpoints](/rest/api/createResource#endpoints)
with easy logic sharing and overrides.

```typescript
import { Entity, createResource } from '@rest-hooks/rest';

class Todo extends Entity {
  readonly id: number = 0;
  readonly userId: number = 0;
  readonly title: string = '';
  readonly completed: boolean = false;

  pk() {
    return `${this.id}`;
  }
}

const TodoResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
});
```

[Introduction to Resource](/rest)

<details><summary><b>Resource Endpoints</b></summary>

```typescript
// read
// GET https://jsonplaceholder.typicode.com/todos/5
const todo = useSuspense(TodoResource.get, { id: 5 });

// GET https://jsonplaceholder.typicode.com/todos
const todos = useSuspense(TodoResource.getList);

// mutate
// POST https://jsonplaceholder.typicode.com/todos
const controller = useController();
controller.fetch(TodoResource.create, { title: 'my todo' });

// PUT https://jsonplaceholder.typicode.com/todos/5
const controller = useController();
controller.fetch(TodoResource.update, { id: 5 }, { title: 'my todo' });

// PATCH https://jsonplaceholder.typicode.com/todos/5
const controller = useController();
controller.fetch(TodoResource.partialUpdate, { id: 5 }, { title: 'my todo' });

// DELETE https://jsonplaceholder.typicode.com/todos/5
const controller = useController();
controller.fetch(TodoResource.delete, { id: 5 });
```

</details>

### @rest-hooks/graphql

[GraphQL](https://graphql.org) support ships in the [@rest-hooks/graphql](https://www.npmjs.com/package/@rest-hooks/graphql)
([docs](/graphql)) package.

```typescript
import { GQLEntity, GQLEndpoint } from '@rest-hooks/graphql';

class User extends GQLEntity {
  readonly name: string = '';
  readonly email: string = '';
}

const gql = new GQLEndpoint('https://nosy-baritone.glitch.me');

const userDetail = gql.query(
  `query UserDetail($name: String!) {
    user(name: $name) {
      id
      name
      email
    }
  }`,
  { user: User },
);
```

```tsx
const { user } = useSuspense(userDetail, { name: 'Fong' });
```

### @rest-hooks/img

A simple ArrayBuffer can be easily achieved using @rest-hooks/endpoint directly

```tsx
import { Endpoint } from '@rest-hooks/endpoint';

export const getPhoto = new Endpoint(async ({ userId }: { userId: string }) => {
  const response = await fetch(`/users/${userId}/photo`);
  const photoArrayBuffer = await response.arrayBuffer();

  return photoArrayBuffer;
});
```

[@rest-hooks/img](./guides/img-media.md) integrates images with
[Suspense](./getting-started/data-dependency.md#async-fallbacks) as well as the [render as you fetch](./guides/render-as-you-fetch.md)
pattern for improved user experience.

## Debugging

<img src={require('@site/static/img/redux-devtools-logo.jpg').default} width="75" height="75" alt="redux-devtools" style={{ float: 'left', "marginRight": "var(--ifm-paragraph-margin-bottom)" }} />

Add the Redux DevTools for
[chrome extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
or
[firefox extension](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

Click the icon to open the [inspector](./guides/debugging.md), which allows you to observe dispatched actions,
their effect on the cache state as well as current cache state.

## Mock data

Writing `FixtureEndpoint`s is a standard format that can be used across all `@rest-hooks/test` helpers as well as your own uses.

<Tabs
defaultValue="detail"
values={[
{ label: 'Detail', value: 'detail' },
{ label: 'Update', value: 'update' },
{ label: '404 error', value: 'detail404' },
]}>
<TabItem value="detail">

```typescript
import type { FixtureEndpoint } from '@rest-hooks/test';
import { todoDetail } from './todo';

const todoDetailFixture: FixtureEndpoint = {
  endpoint: todoDetail,
  args: [{ id: 5 }] as const,
  response: {
    id: 5,
    title: 'Star Rest Hooks on Github',
    userId: 11,
    completed: false,
  },
};
```

</TabItem>
<TabItem value="update">

```typescript
import type { FixtureEndpoint } from '@rest-hooks/test';
import { todoUpdate } from './todo';

const todoUpdateFixture: FixtureEndpoint = {
  endpoint: todoUpdate,
  args: [{ id: 5 }, { completed: true }] as const,
  response: {
    id: 5,
    title: 'Star Rest Hooks on Github',
    userId: 11,
    completed: true,
  },
};
```

</TabItem>
<TabItem value="detail404">

```typescript
import type { FixtureEndpoint } from '@rest-hooks/test';
import { todoDetail } from './todo';

const todoDetail404Fixture: FixtureEndpoint = {
  endpoint: todoDetail,
  args: [{ id: 9001 }] as const,
  response: { status: 404, response: 'Not found' },
  error: true,
};
```

</TabItem>
</Tabs>

- [Mock data for storybook](./guides/storybook.md) with [MockResolver](./api/MockResolver.md)
- [Test hooks](./guides/unit-testing-hooks.md) with [makeRenderRestHook()](./api/makeRenderRestHook.md)
- [Test components](./guides/unit-testing-components.md) with [MockResolver](./api/MockResolver.md) and [mockInitialState()](./api/mockInitialState.md)

## Demo

### Todo Demo {#todo-demo}

<iframe
  src="https://stackblitz.com/github/coinbase/rest-hooks/tree/master/examples/todo-app?embed=1&file=src%2Fpages%2FHome%2FTodoListComponent.tsx&hidedevtools=1&view=both&ctl=1"
  width="100%"
  height="500"
></iframe>

[Open demo in own tab](https://stackblitz.com/github/coinbase/rest-hooks/tree/master/examples/todo-app?file=src%2Fpages%2FHome%2FTodoListComponent.tsx)

[Explore on github](https://github.com/coinbase/rest-hooks/tree/master/examples/todo-app)

### Github Demo {#github-demo}

<iframe
  src="https://stackblitz.com/github/coinbase/rest-hooks/tree/master/examples/github-app?embed=1&file=src%2Fpages%2FIssueList.tsx&hidedevtools=1&view=preview&ctl=1"
  width="100%"
  height="500"
></iframe>

[Open demo in own tab](https://stackblitz.com/github/coinbase/rest-hooks/tree/master/examples/github-app?file=src%2Fpages%2FIssueList.tsx)

[Explore on github](https://github.com/coinbase/rest-hooks/tree/master/examples/github-app)
