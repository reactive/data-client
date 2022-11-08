---
title: Introduction
---

Rest Hooks is an asynchronous data framework for TypeScript and JavaScript. While it is completely protocol and platform agnostic,
it is not a networking stack for things like minecraft game servers.

A good way to tell if this could be useful is if you use something similar to **any** of the following to build data-driven applications:

- API protocols like [REST](https://restfulapi.net/), [GraphQL](https://graphql.org/), [gRPC](https://grpc.io/), [JSON:API](https://jsonapi.org/)
- Transport protocols like [HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview), [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API), [local](../guides/mocking-unfinished.md)
- Async storage engines like [IndexedDb](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [AsyncStorage](https://reactnative.dev/docs/asyncstorage)

Rest Hooks focuses on solving the following challenges in a declarative composable manner

- **Asynchronous** behavior and race conditions
- Dynamic (changing) data **consistency and integrity**
- High **performance** at scale

## Endpoint

[Endpoints](../api/Endpoint.md) describe an asynchronous [API](https://www.freecodecamp.org/news/what-is-an-api-in-english-please-b880a3214a82/).

These define both `runtime` behaviors, as well as (optionally) `typing`.

<!--DOCUSAURUS_CODE_TABS-->

<!--JavaScript-->

```js
import { Endpoint } from '@rest-hooks/endpoint';

const fetchTodoDetail = ({ id }) =>
  fetch(`https://jsonplaceholder.typicode.com/todos/${id}`).then(res =>
    res.json(),
  );

const todoDetail = new Endpoint(fetchTodoDetail);
```

<!--TypeScript-->

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

const fetchTodoDetail = ({ id }: Params): Promise<Todo> =>
  fetch(`https://jsonplaceholder.typicode.com/todos/${id}`).then(res =>
    res.json(),
  );

const todoDetail = new Endpoint(fetchTodoDetail);
```

<!--END_DOCUSAURUS_CODE_TABS-->

By _decoupling_ endpoint definitions from their usage, we are able to reuse them in many contexts.

- Easy reuse in different **components** eases colocating data dependencies
- Reuse with different **hooks** allows different behaviors with the same endpoint
- Reuse across different **platforms** like React Native, React web, or even beyond React in Angular, Svelte, Vue, or Node
- Published as **packages** independent of their consumption

## Colocate data dependencies

Add one-line [data hookup](./data-dependency) in the components that need it with [useResource()](../api/useresource)

```tsx
import { useResource } from 'rest-hooks';

export default function TodoDetail({ id }: { id: number }) {
  const todo = useResource(todoDetail, { id });

  return <div>{todo.title}</div>;
}
```

- Avoid prop drilling
- Data updates only re-render components that need to

## Async Fallbacks with Boundaries

Unify and reuse [loading and error fallbacks](./data-dependency#async-fallbacks-loadingerror) with [Suspense](https://reactjs.org/docs/concurrent-mode-suspense.html) and [NetworkErrorBoundary](../api/NetworkErrorBoundary)

```tsx
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

[Non-Suspense fallback handling](./data-dependency#stateful)

## Mutations

<details><summary><b>todoUpdate</b></summary>

<!--DOCUSAURUS_CODE_TABS-->

<!--JavaScript-->

```js
import { Endpoint } from '@rest-hooks/endpoint';

const fetchTodoUpdate = ({ id }, body) =>
  fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
    method: 'PATCH',
    body,
  }).then(res => res.json());

const todoUpdate = new Endpoint(fetchTodoUpdate, { sideEffect: true });
```

<!--TypeScript-->

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

<!--END_DOCUSAURUS_CODE_TABS-->

</details>

Instead of just calling the `todoUpdate` endpoint with our data, we want to ensure
**all** colocated usages of the todo being edited are updated. This avoid both the complexity and performance
problems of attempting to cascade endpoint refreshes.

[useFetcher](../api/useFetcher) enhances our function, integrating the Rest Hooks store.

```tsx
import { useFetcher } from 'rest-hooks';

const update = useFetcher(todoUpdate);
return <ArticleForm onSubmit={data => update({ id }, data)} />;
```
<details><summary><b>Tracking imperative loading/error</b></summary>

[useLoading()](../api/useLoading) enhances async functions by tracking their loading and error states.

```tsx
import { useLoading } from '@rest-hooks/hooks';

const [update, loading, error] = useLoading(useFetcher(todoUpdate));
```

</details>

However, there is still one issue. Our `todoUpdate` and `todoDetail` endpoint are not aware of each other
so how can Rest Hooks know to update todoDetail with this data?

### Entities

Adding [Entities](./schema#entities) to our endpoint definition tells Rest Hooks
how to extract and find a given piece of data no matter where it is used. The [pk()](../api/Entity#abstract-pk-parent-any-key-string-string--number--undefined) (primary key)
method is used as a key in a lookup table.

<!--DOCUSAURUS_CODE_TABS-->
<!--Entity-->

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

<!--todoDetail-->

```typescript
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

<!--todoUpdate-->

```typescript
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

<!--END_DOCUSAURUS_CODE_TABS-->

### Schema

What if our entity is not the top level item? Here we define the `todoList`
endpoint with `[Todo]` as its schema. [Schemas](./schema) tell Rest Hooks _where_ to find
the Entities. By placing inside a list, Rest Hooks knows to expect a response
where each item of the list is the entity specified.

```typescript
import { Endpoint } from '@rest-hooks/endpoint';

const fetchTodoList = (params: any) =>
  fetch(`https://jsonplaceholder.typicode.com/todos/`).then(res => res.json());

const todoList = new Endpoint(fetchTodoList, {
  schema: [Todo],
  sideEffect: true,
});
```

[Schemas](./schema) also automatically infer and enforce the response type, ensuring
the variable `todos` will be typed precisely. If the API responds in another manner
the hook with throw instead, triggering the `error fallback` specified in [\<NetworkErrorBoundary /\>](../api/NetworkErrorBoundary)

```tsx
import { useResource } from 'rest-hooks';

export default function TodoListComponent() {
  const todos = useResource(todoList, {});

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

However, after toggling todo.completed, this is just too slow! No worries, [optimisticUpdate](../guides/optimistic-updates) tells
Rest Hooks what response it _expects_ to receive from the mutation call, Rest Hooks
can **immediately** update **all** components using the relevant entity.

```typescript
const optimisticUpdate = (params: Params, body: FormData) => ({
  id: params.id,
  ...body,
});
todoUpdate = todoUpdate.extend({
  optimisticUpdate,
});
```

Rest Hooks ensures data integrity against any possible networking failure or race condition, so don't
worry about network failures, multiple mutation calls editing the same data, or other common
problems in asynchronous programming.

<details><summary><b>todoUpdate</b></summary>

```typescript
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
  sideEffect: true,
  schema: Todo,
  optimisticUpdate,
});

const optimisticUpdate = (params: Params, body: FormData) => ({
  id: params.id,
  ...body,
});
```

</details>

## Protocol specific patterns

At this point we've defined `todoDetail`, `todoList` and `todoUpdate`. You might have noticed
that these endpoint definitions share some logic and information. For this reason Rest Hooks
encourages extracting shared logic among endpoints.

One common pattern is having endpoints Create Read Update Delete (CRUD) for a given resource.
Using [@rest-hooks/rest](https://www.npmjs.com/package/@rest-hooks/rest) ([docs](../guides/resource-types)) simplifies these patterns.

Instead of defining an [Entity](../api/Entity), we define a [Resource](../api/resource). `Resource`
extends from `Entity`, so we still need the `pk()` definiton.

In addition, providing [static urlRoot](../api/resource#static-urlroot-string) enable 6 [Endpoints](../api/Endpoint)
with easy logic sharing and overrides.

```typescript
import { Resource } from '@rest-hooks/rest';

class TodoResource extends Resource {
  readonly id: number = 0;
  readonly userId: number = 0;
  readonly title: string = '';
  readonly completed: boolean = false;

  static urlRoot = 'https://jsonplaceholder.typicode.com/todos';

  pk() {
    return `${this.id}`;
  }
}
```

[Introduction to Resource](../guides/resource-types)

<details><summary><b>Usage</b></summary>

```typescript
// read
// GET https://jsonplaceholder.typicode.com/todos/5
const todo = useResource(TodoResource.detail(), { id: 5 });

// GET https://jsonplaceholder.typicode.com/todos
const todos = useResource(TodoResource.list(), {});

// mutate
// POST https://jsonplaceholder.typicode.com/todos
const create = useFetcher(TodoResource.create());
create({}, { title: 'my todo' });

// PUT https://jsonplaceholder.typicode.com/todos/5
const update = useFetcher(TodoResource.update());
update({ id: 5 }, { title: 'my todo' });

// PATCH https://jsonplaceholder.typicode.com/todos/5
const partialUpdate = useFetcher(TodoResource.partialUpdate());
partialUpdate({ id: 5 }, { title: 'my todo' });

// DELETE https://jsonplaceholder.typicode.com/todos/5
const del = useFetcher(TodoResource.delete());
del({ id: 5 });
```

</details>

## Demo

See this all in action in [examples/todo-app](https://github.com/coinbase/rest-hooks/tree/master/examples/todo-app)
