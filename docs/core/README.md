---
title: Introducing the Reactive Data Client
sidebar_label: Introduction
description: Building delightful dynamic applications with NextJS, Expo, React Native and more.
slug: /
id: introduction
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import ProtocolTabs from '@site/src/components/ProtocolTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import Link from '@docusaurus/Link';

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

# The Reactive Data Client

Reactive Data Client provides safe and performant [client access](./api/useSuspense.md) and [mutation](./api/Controller.md#fetch) over [remote data protocols](https://www.freecodecamp.org/news/what-is-an-api-in-english-please-b880a3214a82/).
Both pull/fetch ([REST](/rest) and [GraphQL](/graphql)) and push/stream ([WebSockets or Server Sent Events](./concepts/managers.md#data-stream)) can be used simultaneously.

It has similar goals
to [Relational Databases](https://en.wikipedia.org/wiki/Relational_database)
but for interactive application clients. Because of this, **if your backend uses a [RDBMS](https://en.wikipedia.org/wiki/Relational_database) like [Postgres](https://www.postgresql.org/)
or [MySQL](https://www.mysql.com/) this is a good indication Reactive Data Client might be for you**. Respectively,
just like one might choose [flat files](https://www.techopedia.com/definition/25956/flat-file) over database storage,
sometimes a less powerful client library is sufficient.

This is no small task. To achieve this, Reactive Data Client' design is aimed at **treating remote data like it is
local**. This means component logic should be no more complex than useState and setState.

## Define API {#endpoint}

[Endpoints](./getting-started/resource.md) are the _methods_ of your data. At their core they
are simply asynchronous functions. However, they also define anything else relevant to the [API](https://www.freecodecamp.org/news/what-is-an-api-in-english-please-b880a3214a82/)
like [expiry policy](./concepts/expiry-policy.md), [data model](./concepts/normalization.md), [validation](./concepts/validation.md), and [types](/rest/api/RestEndpoint#typing).

<ThemedImage
alt="Endpoints used in many contexts"
sources={{
    light: useBaseUrl('/img/endpoint-many.png'),
    dark: useBaseUrl('/img/endpoint-many.dark.png'),
  }}
style={{float: "right",marginLeft:"10px"}}
width="415" height="184"
/>

By _decoupling_ endpoint definitions from their usage, we are able to reuse them in many contexts.

- Easy reuse in different **components** eases co-locating data dependencies
- Reuse with different **[hooks](./api/useSuspense.md)** and **[imperative actions](./api/Controller.md)** allows different behaviors with the same endpoint
- Reuse across different **[platforms](./getting-started/installation.md)** like React Native, React web, or even beyond React in Angular, Svelte, Vue, or Node
- Published as **packages** independent of their consumption

Endpoints are extensible and composable, with protocol implementations ([REST](/rest), [GraphQL](/graphql), [Websockets+SSE](./concepts/managers.md#data-stream), [Img/binary](./guides/img-media.md))
to get started quickly, extend, and share common patterns.

<ProtocolTabs>

```ts
import { RestEndpoint } from '@data-client/rest';

const getTodo = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
});
```

```ts
import { GQLEndpoint } from '@data-client/graphql';

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

## Co-locate data dependencies

Make your components reusable by binding the data [where you need it](./getting-started/data-dependency.md) with the one-line [useSuspense()](./api/useSuspense.md). Much like [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await),
[useSuspense()](./api/useSuspense.md) guarantees its data once it returns.

```tsx {4}
import { useSuspense } from '@data-client/react';

export default function TodoDetail({ id }: { id: number }) {
  const todo = useSuspense(getTodo, { id });

  return <div>{todo.title}</div>;
}
```

No more prop drilling, or cumbersome external state management. Reactive Data Client guarantees global referential equality,
data safety and performance.

Co-location also allows [Server Side Rendering](./guides/ssr.md) to incrementally stream HTML, greatly reducing [TTFB](https://web.dev/ttfb/).
[Reactive Data Client SSR](./guides/ssr.md) automatically hydrates its store, allowing immediate interactive mutations with **zero** client-side
fetches on first load.

## Handle loading/error

Avoid 100s of loading spinners by placing [AsyncBoundary](./api/AsyncBoundary.md) around many suspending components.

Typically these are placed at or above navigational boundaries like pages, routes or modals.

```tsx {5,8}
import { AsyncBoundary } from '@data-client/react';

function App() {
  return (
    <AsyncBoundary>
      <AnotherRoute />
      <TodoDetail id={5} />
    </AsyncBoundary>
  );
}
```

[Non-Suspense fallback handling](./getting-started/data-dependency.md#stateful) can also be used for certain
cases in React 16 and 17

## Mutations

[Mutations](./getting-started/mutations.md) present another case of reuse - this time of our data. This case is even more critical
because it can not just lead to code bloat, but data ingrity, tearing, and general application jankiness.

When we call our mutation method/endpoint, we need to ensure **all** uses of that data are updated.
Otherwise we're stuck with the complexity, performance, and stuttery application jank of attempting
to cascade endpoint refreshes.

### Keep data consistent and fresh {#entities}

[Entities](./concepts/normalization.md) define our data model.

This enables a [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) storage pattern, which
prevents 'data tearing' jank and improves performance.

<ProtocolTabs>

```ts
import { Entity } from '@data-client/rest';

export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
}
```

```ts
import { GQLEntity } from '@data-client/graphql';

export class Todo extends GQLEntity {
  userId = 0;
  title = '';
  completed = false;
}
```

</ProtocolTabs>

The [pk()](/rest/api/Entity#pk) (primary key) method is used to build a lookup table. This is
commonly known as data normalization. To avoid bugs, application jank and performance problems,
it is critical to [choose the right (normalized) state structure](https://react.dev/learn/choosing-the-state-structure).

We can now bind our Entity to both our get endpoint and update endpoint, providing our runtime
data integrity as well as TypeScript definitions.

<ProtocolTabs>

```ts {6}
import { RestEndpoint } from '@data-client/rest';

const get = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
});

const update = getTodo.extend({
  method: 'PUT',
});

export const TodoResource = { get, update };
```

```ts {14,25}
import { GQLEndpoint } from '@data-client/graphql';

const gql = new GQLEndpoint('/');

const get = gql.query(
  `query GetTodo($id: ID!) {
    todo(id: $id) {
      id
      title
      completed
    }
  }
`,
  { todo: Todo },
);

const update = gql.mutation(
  `mutation UpdateTodo($todo: Todo!) {
    updateTodo(todo: $todo) {
      id
      title
      completed
    }
  }`,
  { updateTodo: Todo },
);

export const TodoResource = { get, update };
```

</ProtocolTabs>

### Tell react to update

Just like `setState()`, we must make React aware of the any mutations so it can rerender.

[Controller](./api/Controller.md) provides this functionality in a type-safe manner.
[Controller.fetch()](./api/Controller.md#fetch) lets us trigger mutations.

We can [useController](./api/useController.md) to access it in React components.

<ProtocolTabs>

```tsx
import { useController } from '@data-client/react';

function ArticleEdit() {
  const ctrl = useController();
  // highlight-next-line
  const handleSubmit = data => ctrl.fetch(TodoResource.update, { id }, data);
  return <ArticleForm onSubmit={handleSubmit} />;
}
```

```tsx
import { useController } from '@data-client/react';

function ArticleEdit() {
  const ctrl = useController();
  // highlight-next-line
  const handleSubmit = data => ctrl.fetch(TodoResource.update, { id, ...data });
  return <ArticleForm onSubmit={handleSubmit} />;
}
```

</ProtocolTabs>

<details>
<summary><b>Tracking imperative loading/error state</b></summary>

[useLoading()](./api/useLoading.md) enhances async functions by tracking their loading and error states.

```tsx
import { useController, useLoading } from '@data-client/react';

function ArticleEdit() {
  const ctrl = useController();
  // highlight-next-line
  const [handleSubmit, loading, error] = useLoading(
    data => ctrl.fetch(TodoResource.update, { id }, data),
    [ctrl],
  );
  return <ArticleForm onSubmit={handleSubmit} loading={loading} />;
}
```

</details>

### More data modeling

What if our entity is not the top level item? Here we define the `getList`
endpoint with [new Collection([Todo])](/rest/api/Collection) as its schema. [Schemas](./concepts/normalization.md#schema) tell Reactive Data Client _where_ to find
the Entities. By placing inside a list, Reactive Data Client knows to expect a response
where each item of the list is the entity specified.

```typescript {6}
import { RestEndpoint, Collection } from '@data-client/rest';

// get and update definitions omitted

const getList = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos',
  schema: new Collection([Todo]),
  searchParams: {} as { userId?: string | number } | undefined,
  paginationField: 'page',
});

export default TodoResource = { getList, get, update };
```

[Schemas](./concepts/normalization.md) also automatically infer and enforce the response type, ensuring
the variable `todos` will be typed precisely.

```tsx {4}
import { useSuspense } from '@data-client/react';

export default function TodoList() {
  const todos = useSuspense(TodoResource.getList);

  return (
    <div>
      {todos.map(todo => (
        <TodoListItem key={todo.pk()} todo={todo} />
      ))}
    </div>
  );
}
```

Now we've used our data model in three cases - `TodoResource.get`, `TodoResource.getList` and `TodoResource.update`. Data consistency
(as well as referential equality) will be guaranteed between the endpoints, even after mutations occur.

### Organizing Endpoints

At this point we've defined `TodoResource.get`, `TodoResource.getList` and `TodoResource.update`. You might have noticed
that these endpoint definitions share some logic and information. For this reason Reactive Data Client
encourages extracting shared logic among endpoints.

[Resources](/rest/api/resource) are collections of endpoints that operate on the same data.

```typescript
import { Entity, resource } from '@data-client/rest';

class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
}

const TodoResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
  searchParams: {} as { userId?: string | number } | undefined,
  paginationField: 'page',
});
```

[Introduction to Resource](./getting-started/resource.md)

<details>
<summary><b>Resource Endpoints</b></summary>

```typescript
// read
// GET https://jsonplaceholder.typicode.com/todos/5
const todo = useSuspense(TodoResource.get, { id: 5 });

// GET https://jsonplaceholder.typicode.com/todos
const todos = useSuspense(TodoResource.getList);

// GET https://jsonplaceholder.typicode.com/todos?userId=1
const todos = useSuspense(TodoResource.getList, { userId: 1 });

// mutate
const ctrl = useController();

// GET https://jsonplaceholder.typicode.com/todos?userId=1
ctrl.fetch(TodoResource.getList.getPage, { userId: 1, page: 2 });

// POST https://jsonplaceholder.typicode.com/todos
ctrl.fetch(TodoResource.getList.push, { title: 'my todo' });

// POST https://jsonplaceholder.typicode.com/todos?userId=1
ctrl.fetch(TodoResource.getList.push, { userId: 1 }, { title: 'my todo' });

// PUT https://jsonplaceholder.typicode.com/todos/5
ctrl.fetch(TodoResource.update, { id: 5 }, { title: 'my todo' });

// PATCH https://jsonplaceholder.typicode.com/todos/5
ctrl.fetch(TodoResource.partialUpdate, { id: 5 }, { title: 'my todo' });

// DELETE https://jsonplaceholder.typicode.com/todos/5
ctrl.fetch(TodoResource.delete, { id: 5 });
```

</details>

### Zero delay mutations {#optimistic-updates}

[Controller.fetch](./api/Controller.md#fetch) call the mutation endpoint, and update React based on the response.
While [useTransition](https://react.dev/reference/react/useTransition) improves the experience,
the UI still ultimately waits on the fetch completion to update.

For many cases like toggling todo.completed, incrementing an upvote, or dragging and drop
a frame this can be too slow!

We can optionally tell Reactive Data Client to perform the React renders immediately. To do this
we'll need to specify _how_.

[getOptimisticResponse](/rest/guides/optimistic-updates) is just like [setState with an updater function](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state). Using [snap](./api/Snapshot.md) for access to the store to get the previous
value, as well as the fetch arguments, we return the _expected_ fetch response.

```typescript
const update = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  method: 'PUT',
  schema: Todo,
  // highlight-start
  getOptimisticResponse(snap, { id }, body) {
    return {
      id,
      ...body,
    };
  },
  // highlight-end
});
```

Reactive Data Client ensures [data integrity against any possible networking failure or race condition](/rest/guides/optimistic-updates#optimistic-transforms), so don't
worry about network failures, multiple mutation calls editing the same data, or other common
problems in asynchronous programming.

### Remotely triggered mutations

Sometimes data change is initiated remotely - either due to other users on the site, admins, etc. Declarative
[expiry policy](./concepts/expiry-policy.md) controls allow tight control over updates due to fetching.

However, for data that changes frequently (like exchange price tickers, or live conversations) sometimes push-based
protocols are used like Websockets or Server Sent Events. Reactive Data Client has a [powerful middleware layer called Managers](./api/Manager.md),
which can be used to [initiate data updates](./concepts/managers.md#data-stream) when receiving new data pushed from the server.

<details>
<summary><b>StreamManager</b></summary>

```typescript
import type { Manager, Middleware, ActionTypes } from '@data-client/react';
import { Controller, actionTypes } from '@data-client/react';
import type { EntityInterface } from '@data-client/rest';

export default class StreamManager implements Manager {
  protected declare evtSource: WebSocket | EventSource;
  protected declare entities: Record<string, typeof EntityInterface>;

  constructor(
    evtSource: WebSocket | EventSource,
    entities: Record<string, EntityInterface>,
  ) {
    this.evtSource = evtSource;
    this.entities = entities;
  }

  middleware: Middleware = controller => {
    this.evtSource.onmessage = event => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type in this.endpoints)
          controller.set(this.entities[msg.type], ...msg.args, msg.data);
      } catch (e) {
        console.error('Failed to handle message');
        console.error(e);
      }
    };
    return next => async action => next(action);
  };

  cleanup() {
    this.evtSource.close();
  }
}
```

</details>

If we don't want the full data stream, we can [useSubscription()](./api/useSubscription.md) or [useLive()](./api/useLive.md)
to ensure we only listen to the data we care about.

Endpoints with [pollFrequency](/rest/api/RestEndpoint#pollfrequency) allow reusing the existing HTTP endpoints, eliminating
the need for additional websocket or SSE backends.
Polling is globally orchestrated by the [SubscriptionManager](./api/SubscriptionManager.md), so even with many
components subscribed Reactive Data Client will never overfetch.

[//]: # 'TODO: ## Relational joins and nesting'

## Debugging

<img src={require('@site/static/img/redux-devtools-logo.jpg').default} width="75" height="75" alt="redux-devtools" style={{ float: 'left', "marginRight": "var(--ifm-paragraph-margin-bottom)" }} />

Add the Redux DevTools for
[chrome extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
or
[firefox extension](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

Click the icon to open the [inspector](./getting-started/debugging.md), which allows you to observe dispatched actions,
their effect on the cache state as well as current cache state.

## Mock data

Writing [Fixtures](./api/Fixtures.md) is a standard format that can be used across all `@data-client/test` helpers as well as your own uses.

<Tabs
defaultValue="detail"
values={[
{ label: 'Detail', value: 'detail' },
{ label: 'Update', value: 'update' },
{ label: '404 error', value: 'detail404' },
{ label: 'Interceptor', value: 'interceptor' },
{ label: 'Interceptor (stateful)', value: 'interceptor-stateful' },
]}>
<TabItem value="detail">

```typescript
import type { Fixture } from '@data-client/test';
import { getTodo } from './todo';

const todoDetailFixture: Fixture = {
  endpoint: getTodo,
  args: [{ id: 5 }] as const,
  response: {
    id: 5,
    title: 'Star Reactive Data Client on Github',
    userId: 11,
    completed: false,
  },
};
```

</TabItem>
<TabItem value="update">

```typescript
import type { Fixture } from '@data-client/test';
import { updateTodo } from './todo';

const todoUpdateFixture: Fixture = {
  endpoint: updateTodo,
  args: [{ id: 5 }, { completed: true }] as const,
  response: {
    id: 5,
    title: 'Star Reactive Data Client on Github',
    userId: 11,
    completed: true,
  },
};
```

</TabItem>
<TabItem value="detail404">

```typescript
import type { Fixture } from '@data-client/test';
import { getTodo } from './todo';

const todoDetail404Fixture: Fixture = {
  endpoint: getTodo,
  args: [{ id: 9001 }] as const,
  response: { status: 404, response: 'Not found' },
  error: true,
};
```

</TabItem>
<TabItem value="interceptor">

```typescript
import type { Interceptor } from '@data-client/test';

const currentTimeInterceptor: Interceptor = {
  endpoint: new RestEndpoint({
    path: '/api/currentTime/:id',
  }),
  response({ id }) {
    return {
      id,
      updatedAt: new Date().toISOString(),
    };
  },
  delay: () => 150,
};
```

</TabItem>
<TabItem value="interceptor-stateful">

```typescript
import type { Interceptor } from '@data-client/test';

const incrementInterceptor: Interceptor = {
  endpoint: new RestEndpoint({
    path: '/api/count/increment',
    method: 'POST',
    body: undefined,
  }),
  response() {
    return {
      count: (this.count = this.count + 1),
    };
  },
  delay: () => 150,
};
```

</TabItem>
</Tabs>

- [Mock data for storybook](./guides/storybook.md) with [MockResolver](./api/MockResolver.md)
- [Test hooks](./guides/unit-testing-hooks.md) with [renderDataHook()](./api/renderDataHook.md)
- [Test components](./guides/unit-testing-components.md) with [MockResolver](./api/MockResolver.md) and [mockInitialState()](./api/mockInitialState.md)

## Demo

<Tabs
defaultValue="todo"
values={[
{ label: 'Todo', value: 'todo' },
{ label: 'GitHub', value: 'github' },
{ label: 'NextJS SSR', value: 'nextjs' },
]}
groupId="Demos"

>   <TabItem value="todo">

<iframe
  loading="lazy"
  src="https://stackblitz.com/github/reactive/data-client/tree/master/examples/todo-app?embed=1&file=src%2Fpages%2FHome%2FTodoList.tsx&hidedevtools=1&view=both&terminalHeight=0&hideNavigation=1"
  width="100%"
  height="500"
></iframe>

[![Explore on GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/todo-app)
</TabItem>

  <TabItem value="github">
<iframe
  loading="lazy"
  src="https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?embed=1&file=src%2Fpages%2FIssueList.tsx&hidedevtools=1&view=preview&terminalHeight=0&hideNavigation=1"
  width="100%"
  height="500"
></iframe>

[![Explore on GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/github-app)
</TabItem>
<TabItem value="nextjs">

<iframe
  loading="lazy"
  src="https://stackblitz.com/github/reactive/data-client/tree/master/examples/nextjs?embed=1&file=components%2Ftodo%2FTodoList.tsx&hidedevtools=1&view=both&terminalHeight=0&showSidebar=0&hideNavigation=1"
  width="100%"
  height="500"
></iframe>

[![Explore on GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/nextjs)
</TabItem>
</Tabs>

<p style={{textAlign: 'center'}}>
<Link className="button button--secondary" to="/demos">More Demos</Link>&nbsp;
<Link className="button button--secondary" to="https://chatgpt.com/g/g-682609591fe48191a6850901521b4e4b-typescript-rest-codegen"><img src="/img/gpt.svg" alt="Codegen GPT" style={{
          height: '1em',              // Match font size
          verticalAlign: '-0.125em',  // Fine-tune: try -0.125em or 'middle'
          display: 'inline',          // Inline with text
        }}
/> Codegen</Link>
</p>
