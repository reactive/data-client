---
title: RestEndpoint - Strongly typed path-based HTTP API definitions
sidebar_label: RestEndpoint
description: Strongly typed path-based extensible HTTP API definitions.
---

<head>
  <meta name="docsearch:pagerank" content="30"/>
</head>

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';
import Grid from '@site/src/components/Grid';
import Link from '@docusaurus/Link';
import HooksPlayground from '@site/src/components/HooksPlayground';

# RestEndpoint

`RestEndpoints` are for [HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP) based protocols like REST.

:::info extends

`RestEndpoint` extends [Endpoint](./Endpoint.md)

:::

<details>
<summary><b>Interface</b></summary>

<Tabs
defaultValue="RestEndpoint"
values={[
{ label: 'RestEndpoint', value: 'RestEndpoint' },
{ label: 'Endpoint', value: 'Endpoint' },
]}>
<TabItem value="RestEndpoint">

```typescript
interface RestGenerics {
  readonly path: string;
  readonly schema?: Schema | undefined;
  readonly method?: string;
  readonly body?: any;
  readonly searchParams?: any;
  readonly paginationField?: string;
  process?(value: any, ...args: any): any;
}

export class RestEndpoint<O extends RestGenerics = any> extends Endpoint {
  /* Prepare fetch */
  readonly path: string;
  readonly urlPrefix: string;
  readonly requestInit: RequestInit;
  readonly method: string;
  readonly paginationField?: string;
  readonly signal: AbortSignal | undefined;
  url(...args: Parameters<F>): string;
  searchToString(searchParams: Record<string, any>): string;
  getRequestInit(
    this: any,
    body?: RequestInit['body'] | Record<string, unknown>,
  ): Promise<RequestInit> | RequestInit;
  getHeaders(headers: HeadersInit): Promise<HeadersInit> | HeadersInit;

  /* Perform/process fetch */
  fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
  parseResponse(response: Response): Promise<any>;
  process(value: any, ...args: Parameters<F>): any;

  testKey(key: string): boolean;
}
```

</TabItem>
<TabItem value="Endpoint">

```typescript
class Endpoint<F extends (...args: any) => Promise<any>> {
  constructor(fetchFunction: F, options: EndpointOptions);

  key(...args: Parameters<F>): string;

  readonly sideEffect?: true;

  readonly schema?: Schema;

  /** Default data expiry length, will fall back to NetworkManager default if not defined */
  readonly dataExpiryLength?: number;
  /** Default error expiry length, will fall back to NetworkManager default if not defined */
  readonly errorExpiryLength?: number;
  /** Poll with at least this frequency in miliseconds */
  readonly pollFrequency?: number;
  /** Marks cached resources as invalid if they are stale */
  readonly invalidIfStale?: boolean;
  /** Enables optimistic updates for this request - uses return value as assumed network response */
  readonly getOptimisticResponse?: (
    snap: SnapshotInterface,
    ...args: Parameters<F>
  ) => ResolveType<F>;
  /** Determines whether to throw or fallback to */
  readonly errorPolicy?: (error: any) => 'soft' | undefined;

  testKey(key: string): boolean;
}
```

</TabItem>
</Tabs>

</details>

## Usage

All options are supported as arguments to the constructor, [extend](#extend), and as overrides when using [inheritance](#inheritance)

### Simplest retrieval

<Grid>

```ts
const getTodo = new RestEndpoint({
  path: '/todos/:id',
});
```

```ts
const todo = await getTodo({ id: 1 });
```

</Grid>

### Configuration sharing

Use [RestEndpoint.extend()](#extend) instead of `{...getTodo}` ([Object spread](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax#spread_in_object_literals))

```ts
const updateTodo = getTodo.extend({ method: 'PUT' });
```

### Managing state

<TypeScriptEditor>

```ts path=Todo.ts
export class Todo extends Entity {
  id = '';
  title = '';
  completed = false;
}

export const getTodo = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
});
export const updateTodo = getTodo.extend({ method: 'PUT' });
```

</TypeScriptEditor>

Using a [Schema](./schema.md) enables [automatic data consistency](/docs/concepts/normalization) without the need to hurt performance with [refetching](/docs/api/Controller#expireAll).

### Typing

<TypeScriptEditor>

```ts title="Comment" collapsed
export class Comment extends Entity {
  id = '';
  title = '';
  body = '';
  postId = '';

  static key = 'Comment';
}
```

```ts title="Usage"
import { Comment } from './Comment';

const getComments = new RestEndpoint({
  path: '/posts/:postId/comments',
  schema: new Collection([Comment]),
  searchParams: {} as { sortBy?: 'votes' | 'recent' } | undefined,
});

// Hover your mouse over 'comments' to see its type
const comments = useSuspense(getComments, {
  postId: '5',
  sortBy: 'votes',
});

const ctrl = useController();
const createComment = async data =>
  ctrl.fetch(getComments.push, { postId: '5' }, data);
```

</TypeScriptEditor>

#### Resolution/Return

[schema](#schema) determines the return value when used with data-binding hooks like [useSuspense](/docs/api/useSuspense), [useDLE](/docs/api/useDLE), [useCache](/docs/api/useCache)
or when used with [Controller.fetch](/docs/api/Controller#fetch)

<TypeScriptEditor>

```ts title="Todo.ts" collapsed
export class Todo extends Entity {
  id = '';
  title = '';
  completed = false;

  static key = 'Todo';
}
```

```ts title="getTodo.ts"
import { Todo } from './Todo';

const getTodo = new RestEndpoint({ path: '/', schema: Todo });
// Hover your mouse over 'todo' to see its type
const todo = useSuspense(getTodo);

async () => {
  const ctrl = useController();
  const todo2 = await ctrl.fetch(getTodo);
};
```

</TypeScriptEditor>

[process](#process) determines the resolution value when the endpoint is called directly. For
`RestEndpoints` without a schema, it also determines the return type of [hooks](/docs/api/useSuspense) and [Controller.fetch](/docs/api/Controller#fetch).

<TypeScriptEditor>

```ts path="process.ts"
interface TodoInterface {
  title: string;
  completed: boolean;
}
const getTodo = new RestEndpoint({
  path: '/',
  process(value): TodoInterface {
    return value;
  },
});
async () => {
  // todo is TodoInterface
  const todo = await getTodo();

  const ctrl = useController();
  const todo2 = await ctrl.fetch(getTodo);
};
```

</TypeScriptEditor>

#### Function Parameters

[path](#path) used to construct the url determines the type of the first argument. If it has no patterns,
then the 'first' argument is skipped.

<TypeScriptEditor>

```ts
const getRoot = new RestEndpoint({ path: '/' });
getRoot();
const getById = new RestEndpoint({ path: '/:id' });
// both number and string types work as they are serialized into strings to construct the url
getById({ id: 5 });
getById({ id: '5' });
```

</TypeScriptEditor>

[method](#method) determines whether there is a second argument to be sent as the [body](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#body).

<TypeScriptEditor>

```ts path=method.ts
export const update = new RestEndpoint({
  path: '/:id',
  method: 'PUT',
});
update({ id: 5 }, { title: 'updated', completed: true });
```

</TypeScriptEditor>

However, this is typed as 'any' so it won't catch typos.

[body](#body) can be used to type the argument after the url parameters. It is only used for typing so the
value sent does not matter. `undefined` value can be used to 'disable' the second argument.

<TypeScriptEditor>

```ts path=body.ts
export const update = new RestEndpoint({
  path: '/:id',
  method: 'PUT',
  body: {} as TodoInterface,
});
update({ id: 5 }, { title: 'updated', completed: true });
// `undefined` disables 'body' argument
const rpc = new RestEndpoint({
  path: '/:id',
  method: 'PUT',
  body: undefined,
});
rpc({ id: 5 });
```

</TypeScriptEditor>

[searchParams](#searchParams) can be used in a similar way to `body` to specify types extra parameters, used
for the GET searchParams/queryParams in a [url()](#url).

```ts
const getUsers = new RestEndpoint({
  path: '/:group/user/:id',
  searchParams: {} as { isAdmin?: boolean; sort: 'asc' | 'desc' },
});
getList.url({ group: 'big', id: '5', sort: 'asc' }) ===
  '/big/user/5?sort=asc';
getList.url({
  group: 'big',
  id: '5',
  sort: 'desc',
  isAdmin: true,
}) === '/big/user/5?isAdmin=true&sort=asc';
```

## Fetch Lifecycle

RestEndpoint adds to Endpoint by providing customizations for a provided fetch method using
[inheritance](#inheritance) or [.extend()](#extend).

import Lifecycle from '../diagrams/\_restendpoint_lifecycle.mdx';

<Lifecycle/>

```ts title="fetch implementation for RestEndpoint"
function fetch(...args) {
  const urlParams = this.#hasBody && args.length < 2 ? {} : args[0] || {};
  const body = this.#hasBody ? args[args.length - 1] : undefined;
  return this.fetchResponse(
    this.url(urlParams),
    await this.getRequestInit(body),
  )
    .then(response => this.parseResponse(response))
    .then(res => this.process(res, ...args));
}
```

## Prepare Fetch

Members double as options (second constructor arg). While none are required, the first few
have defaults.

### url(params): string {#url}

`urlPrefix` + `path template` + '?' + searchToString(`searchParams`)

`url()` uses the `params` to fill in the [path template](#path). Any unused `params` members are then used
as [searchParams](https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams) (aka 'GET' params - the stuff after `?`).

<details collapsed>
<summary><b>Implementation</b></summary>

```typescript
import { getUrlBase, getUrlTokens } from '@rest-hooks/rest';

url(urlParams = {}) {
  const urlBase = getUrlBase(this.path)(urlParams);
  const tokens = getUrlTokens(this.path);
  const searchParams = {};
  Object.keys(urlParams).forEach(k => {
    if (!tokens.has(k)) {
      searchParams[k] = urlParams[k];
    }
  });
  if (Object.keys(searchParams).length) {
    return `${this.urlPrefix}${urlBase}?${this.searchToString(searchParams)}`;
  }
  return `${this.urlPrefix}${urlBase}`;
}
```

</details>

### searchToString(searchParams): string {#searchToString}

Constructs the [searchParams](https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams) component of [url](#url).

By default uses the standard [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) global.

[searchParams](https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams) (aka queryParams) are sorted to maintain determinism.

<details collapsed>
<summary><b>Implementation</b></summary>

```typescript
searchToString(searchParams) {
  const params = new URLSearchParams(searchParams);
  params.sort();
  return params.toString();
}
```

</details>

#### Using `qs` library

To encode complex objects in the searchParams, you can use the [qs](https://github.com/ljharb/qs) library.

```typescript
import { RestEndpoint, RestGenerics } from '@data-client/rest';
import qs from 'qs';

class QSEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  searchToString(searchParams) {
    // highlight-next-line
    return qs.stringify(searchParams);
  }
}
```

<EndpointPlayground input="/foo?a%5Bb%5D=c" init={{method: 'GET', headers: {'Content-Type': 'application/json'}}}>

```typescript title="QSEndpoint" collapsed {7}
import { RestEndpoint, RestGenerics } from '@data-client/rest';
import qs from 'qs';

export default class QSEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  searchToString(searchParams) {
    return qs.stringify(searchParams);
  }
}
```

```typescript title="getFoo"
import QSEndpoint from './QSEndpoint';

const getFoo = new QSEndpoint({
  path: '/foo',
  searchParams: {} as { a: Record<string, string> },
});

getFoo({ a: { b: 'c' } });
```

</EndpointPlayground>

### path: string {#path}

Uses [path-to-regexp](https://github.com/pillarjs/path-to-regexp#compile-reverse-path-to-regexp) to build
urls using the parameters passed. This also informs the types so they are properly enforced.

`:` prefixed words are key names. Both strings and numbers are accepted as options.

<TypeScriptEditor>

```ts
const getThing = new RestEndpoint({ path: '/:group/things/:id' });
getThing({ group: 'first', id: 77 });
```

</TypeScriptEditor>

`?` to indicate optional parameters

<TypeScriptEditor>

```ts
const optional = new RestEndpoint({
  path: '/:group/things/:number?',
});
optional({ group: 'first' });
optional({ group: 'first', number: 'fifty' });
```

</TypeScriptEditor>

`\\` to escape special characters `:`, `?`, `+`, `*`, `{`, or `}`

<TypeScriptEditor>

```ts
const getSite = new RestEndpoint({
  path: 'https\\://site.com/:slug',
});
getSite({ slug: 'first' });
```

</TypeScriptEditor>

:::info

Types are inferred automatically from `path`.

Additional parameters can be specified with [searchParams](#searchParams)
and [body](#body).

:::

### searchParams {#searchParams}

`searchParams` can be to specify types extra parameters, used for the GET searchParams/queryParams in a [url()](#url).

The actual **value is not used** in any way - this only determines [typing](#typing).

<EndpointPlayground input="https://site.com/cool?isReact=true" init={{method: 'GET', headers: {'Content-Type': 'application/json'}}}>

```typescript title="getFoo"
const getReactSite = new RestEndpoint({
  path: 'https\\://site.com/:slug',
  searchParams: {} as { isReact: boolean },
});

getReactSite({ slug: 'cool', isReact: true });
```

</EndpointPlayground>

### body {#body}

`body` can be used to set a second argument for mutation endpoints. The actual **value is not
used** in any way - this only determines [typing](#typing).

This is only used by endpoings with a method that uses body: 'POST', 'PUT', 'PATCH'.

<EndpointPlayground input="https://site.com/cool" init={{method: 'POST', body: '{ "url": "/" }', headers: {'Content-Type': 'application/json'}}}>

```ts {4}
const updateSite = new RestEndpoint({
  path: 'https\\://site.com/:slug',
  method: 'POST',
  body: {} as { url: string },
});

updateSite({ slug: 'cool' }, { url: '/' });
```

</EndpointPlayground>

### paginationField

If specified, will add [getPage](#getpage) method on the `RestEndpoint`. [Pagination guide](../guides/pagination.md). Schema
must also contain a [Collection](./Collection.md).

### urlPrefix: string = '' {#urlPrefix}

Prepends this to the compiled [path](#path)

#### Inheritance defaults

```typescript
export class MyEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  // this allows us to override the prefix in production environments, with a dev fallback
  urlPrefix = process.env.API_SERVER ?? 'http://localhost:8000';
}
```

[Learn more about inheritance patterns](#inheritance) for RestEndpoint

#### Instance overrides

```typescript
export const getTicker = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:product_id/ticker',
  schema: Ticker,
});
```

#### Dynamic prefix

:::tip

For a dynamic prefix, try overriding the url() method instead:

```ts
const getTodo = new RestEndpoint({
  path: '/todo/:id',
  url(...args) {
    return dynamicPrefix() + super.url(...args);
  },
});
```

:::

### method: string = 'GET' {#method}

[Method](https://developer.mozilla.org/en-US/docs/Web/API/Request/method) is part of the HTTP protocol.
REST protocols use these to indicate the type of operation. Because of this RestEndpoint uses this
to inform `sideEffect` and whether the endpoint should use a `body` payload. Setting
`sideEffect` explicitly will override this behavior, allowing for non-standard API designs.

`GET` is 'readonly', other methods imply sideEffects.

`GET` and `DELETE` both default to no `body`.

:::tip How method affects function Parameters

`method` only influences parameters in the RestEndpoint constructor and _not_ [.extend()](#extend).
This allows non-standard method-body combinations.

`body` will default to `any`. You can always set body explicitly to take full control. `undefined` can be used
to indicate there is no body.

<TypeScriptEditor>

```ts
(id: string, myPayload: Record<string, unknown>) => {
  const standardCreate = new RestEndpoint({
    path: '/:id',
    method: 'POST',
  });
  standardCreate({ id }, myPayload);
  const nonStandardEndpoint = new RestEndpoint({
    path: '/:id',
    method: 'POST',
    body: undefined,
  });
  // no second 'body' argument, because body was set to 'undefined'
  nonStandardEndpoint({ id });
};
```

</TypeScriptEditor>

:::

### getRequestInit(body): RequestInit {#getRequestInit}

Prepares [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) used in fetch.
This is sent to [fetchResponse](#fetchResponse)

:::tip async

<TypeScriptEditor>

```ts
import { RestEndpoint, RestGenerics } from '@data-client/rest';

export default class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async getRequestInit(body) {
    return {
      ...(await super.getRequestInit(body)),
      method: await getMethod(),
    };
  }
}

async function getMethod() {
  return 'GET';
}
```

</TypeScriptEditor>

:::

### getHeaders(headers: HeadersInit): HeadersInit {#getHeaders}

Called by [getRequestInit](#getRequestInit) to determine [HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/API/Request/headers)

This is often useful for [authentication](../guides/auth)

:::warning

Don't use hooks here. If you need to use hooks, try using [hookifyResource](./hookifyResource.md)

:::

:::tip async

<TypeScriptEditor>

```ts
import { RestEndpoint, RestGenerics } from '@data-client/rest';

export default class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      'Access-Token': await getAuthToken(),
    };
  }
}

async function getAuthToken() {
  return 'example';
}
```

</TypeScriptEditor>

:::

## Handle fetch

### fetchResponse(input, init): Promise {#fetchResponse}

Performs the [fetch(input, init)](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) call. When
[response.ok](https://developer.mozilla.org/en-US/docs/Web/API/Response/ok) is not `true` (like 404),
will throw a NetworkError.

### parseResponse(response): Promise {#parseResponse}

Takes the [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) and parses via [.text()](https://developer.mozilla.org/en-US/docs/Web/API/Response/text) or [.json()](https://developer.mozilla.org/en-US/docs/Web/API/Response/json) depending
on ['content-type' header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type) having 'json' (e.g., `application/json`).

If `status` is 204, resolves as `null`.

Override this to handle other response types like [arrayBuffer](https://developer.mozilla.org/en-US/docs/Web/API/Response/arrayBuffer)

### process(value, ...args): any {#process}

Perform any transforms with the parsed result. Defaults to identity function (do nothing).

:::tip

The return type of process can be used to set the return type of the endpoint fetch:

<TypeScriptEditor row={false}>

```ts title="getTodo.ts" {4}
export const getTodo = new RestEndpoint({
  path: '/todos/:id',
  // The identity function is the default value; so we aren't changing any runtime behavior
  process(value): TodoInterface {
    return value;
  },
});

interface TodoInterface {
  id: string;
  title: string;
  completed: boolean;
}
```

```ts title="useTodo.ts"
import { getTodo } from './getTodo';

async (id: string) => {
  // hover title to see it is a string
  // see TS autocomplete by deleting `.title` and retyping the `.`
  const title = (await getTodo({ id })).title;
};
```

</TypeScriptEditor>

:::

## Endpoint Lifecycle

### schema?: Schema {#schema}

[Declarative data lifecycle](./schema.md)

- Global data consistency and performance with [DRY](https://www.plutora.com/blog/understanding-the-dry-dont-repeat-yourself-principle) state: [where](./schema.md) to expect [Entities](./Entity.md)
- Functions to [deserialize fields](/rest/guides/network-transform#deserializing-fields)
- [Race condition handling](./Entity.md#shouldreorder)
- [Validation](./Entity.md#validate)

```tsx
import { Entity, RestEndpoint } from '@data-client/rest';

class User extends Entity {
  id = '';
  username = '';
}

const getUser = new RestEndpoint({
  path: '/users/:id',
  schema: User,
});
```

### key(urlParams): string {#key}

Serializes the parameters. This is used to build a lookup key in global stores.

Default:

```typescript
`${this.method} ${this.url(urlParams)}`;
```

### testKey(key): boolean {#testKey}

Returns `true` if the provided (fetch) [key](#key) matches this endpoint.

This is used for mock interceptors with with [&lt;MockResolver /&gt;](/docs/api/MockResolver),
[Controller.expireAll()](/docs/api/Controller#expireAll), and [Controller.invalidateAll()](/docs/api/Controller#invalidateAll).

import EndpointLifecycle from './_EndpointLifecycle.mdx';

<EndpointLifecycle />

## extend(options): RestEndpoint {#extend}

Can be used to further customize the endpoint definition

```typescript
const getUser = new RestEndpoint({ path: '/users/:id' });

const UserDetailNormalized = getUser.extend({
  schema: User,
  getHeaders(headers: HeadersInit): HeadersInit {
    return {
      ...headers,
      'Access-Token': getAuth(),
    };
  },
});
```

## Specialized extenders

These convenience accessors create new endpoints for common [Collection](./Collection.md) operations.
They only work when the `RestEndpoint`'s schema contains a [Collection](./Collection.md).

### push

Creates a POST endpoint that places newly created Entities at the _end_ of a [Collection](./Collection.md).

Returns a new RestEndpoint with [method](#method): 'POST' and schema: [Collection.push](./Collection.md#push)

```tsx
const getTodos = new RestEndpoint({
  path: '/todos',
  searchParams: {} as { userId?: string },
  schema: new Collection([Todo]),
});

// POST /todos - adds new Todo to the end of the list
const newTodo = await ctrl.fetch(
  getTodos.push,
  { userId: '1' },
  { title: 'Buy groceries' },
);
```

```tsx
const UserResource = resource({
  path: '/groups/:group/users/:id',
  schema: User,
});

// POST /groups/five/users - adds new User to the end of the list
const newUser = await ctrl.fetch(
  UserResource.getList.push,
  { group: 'five' },
  { username: 'newuser', email: 'new@example.com' },
);
```

### unshift

Creates a POST endpoint that places newly created Entities at the _start_ of a [Collection](./Collection.md).

Returns a new RestEndpoint with [method](#method): 'POST' and schema: [Collection.unshift](./Collection.md#unshift)

```tsx
const getTodos = new RestEndpoint({
  path: '/todos',
  searchParams: {} as { userId?: string },
  schema: new Collection([Todo]),
});

// POST /todos - adds new Todo to the beginning of the list
const newTodo = await ctrl.fetch(
  getTodos.unshift,
  { userId: '1' },
  { title: 'Urgent task' },
);
```

```tsx
const UserResource = resource({
  path: '/groups/:group/users/:id',
  schema: User,
});

// POST /groups/five/users - adds new User to the start of the list
const newUser = await ctrl.fetch(
  UserResource.getList.unshift,
  { group: 'five' },
  { username: 'priorityuser', email: 'priority@example.com' },
);
```

### assign

Creates a POST endpoint that merges Entities into a [Values](./Values.md) [Collection](./Collection.md).

Returns a new RestEndpoint with [method](#method): 'POST' and schema: [Collection.assign](./Collection.md#assign)

```tsx
const getStats = new RestEndpoint({
  path: '/products/stats',
  schema: new Collection(new Values(Stats)),
});

// POST /products/stats - add/update entries in the Values collection
await ctrl.fetch(getStats.assign, {
  'BTC-USD': { product_id: 'BTC-USD', volume: 1000 },
  'ETH-USD': { product_id: 'ETH-USD', volume: 500 },
});
```

```tsx
const StatsResource = resource({
  urlPrefix: 'https://api.exchange.example.com',
  path: '/products/:product_id/stats',
  schema: Stats,
}).extend({
  getList: {
    path: '/products/stats',
    schema: new Collection(new Values(Stats)),
  },
});

// POST /products/stats - add/update entries
await ctrl.fetch(StatsResource.getList.assign, {
  'BTC-USD': { product_id: 'BTC-USD', volume: 1000 },
});
```

### remove

Creates a PATCH endpoint that removes Entities from a [Collection](./Collection.md) and updates them with the response.

Returns a new RestEndpoint with [method](#method): 'PATCH' and schema: [Collection.remove](./Collection.md#remove)

```tsx
const getTodos = new RestEndpoint({
  path: '/todos',
  schema: new Collection([Todo]),
});

// PATCH /todos - removes Todo from collection AND updates the entity
await ctrl.fetch(getTodos.remove, {}, { id: '123', completed: true });
```

```tsx
const UserResource = resource({
  path: '/groups/:group/users/:id',
  schema: User,
});

// PATCH /groups/five/users - removes user from 'five' group list
// AND updates the user entity with response data (e.g., new group)
await ctrl.fetch(
  UserResource.getList.remove,
  { group: 'five' },
  { id: '2', group: 'newgroup' },
);
```

To use the remove schema with a different endpoint (e.g., DELETE):

```ts
const deleteAndRemove = MyResource.delete.extend({
  schema: MyResource.getList.schema.remove,
});
```

### move

Creates a PATCH endpoint that moves Entities between [Collections](./Collection.md). It removes from
collections matching the entity's existing state and adds to collections matching the new values
(from the body/last arg).

Returns a new RestEndpoint with [method](#method): 'PATCH' and schema: [Collection.move](./Collection.md#move)

import { kanbanFixtures, getInitialInterceptorData } from '@site/src/fixtures/kanban';

<HooksPlayground defaultOpen="n" row fixtures={kanbanFixtures} getInitialInterceptorData={getInitialInterceptorData}>

```ts title="TaskResource" collapsed
import { Entity, resource } from '@data-client/rest';

export class Task extends Entity {
  id = '';
  title = '';
  status = 'backlog';
  pk() { return this.id; }
  static key = 'Task';
}
export const TaskResource = resource({
  path: '/tasks/:id',
  searchParams: {} as { status: string },
  schema: Task,
  optimistic: true,
});
```

```tsx title="TaskCard" {5-9}
import { useController } from '@data-client/react';
import { TaskResource, type Task } from './TaskResource';

export default function TaskCard({ task }: { task: Task }) {
  const handleMove = () => ctrl.fetch(
    TaskResource.getList.move,
    { id: task.id },
    { id: task.id, status: task.status === 'backlog' ? 'in-progress' : 'backlog' },
  );
  const ctrl = useController();
  return (
    <div className="listItem">
      <span style={{ flex: 1 }}>{task.title}</span>
      <button onClick={handleMove}>
        {task.status === 'backlog' ? '\u25bc' : '\u25b2'}
      </button>
    </div>
  );
}
```

```tsx title="TaskBoard" collapsed
import { useSuspense } from '@data-client/react';
import { TaskResource } from './TaskResource';
import TaskCard from './TaskCard';

function TaskBoard() {
  const backlog = useSuspense(TaskResource.getList, { status: 'backlog' });
  const inProgress = useSuspense(TaskResource.getList, { status: 'in-progress' });
  return (
    <div>
      <div className="boardColumn">
        <h4>Backlog</h4>
        {backlog.map(task => <TaskCard key={task.pk()} task={task} />)}
      </div>
      <div className="boardColumn">
        <h4>Active</h4>
        {inProgress.map(task => <TaskCard key={task.pk()} task={task} />)}
      </div>
    </div>
  );
}
render(<TaskBoard />);
```

</HooksPlayground>

The remove filter is based on the entity's **existing** values in the store.
The add filter is based on the merged entity values (existing + body).
This uses the same [createCollectionFilter](./Collection.md#createcollectionfilter) logic as push/remove.

```tsx
const UserResource = resource({
  path: '/groups/:group/users/:id',
  schema: User,
});

// PATCH /groups/five/users/5 - moves user 5 from 'five' group to 'ten' group
await ctrl.fetch(
  UserResource.getList.move,
  { group: 'five', id: '2' },
  { id: '2', group: 'ten' },
);
```

### getPage

An endpoint to retrieve the next page using [paginationField](#paginationfield) as the searchParameter key. Schema
must also contain a [Collection](./Collection.md)

```tsx
const getTodos = new RestEndpoint({
  path: '/todos',
  schema: Todo,
  paginationField: 'page',
});

const todos = useSuspense(getTodos);
return (
  <PaginatedList
    items={todos}
    fetchNextPage={() =>
      // fetches url `/todos?page=${nextPage}`
      ctrl.fetch(TodoResource.getList.getPage, { page: nextPage })
    }
  />
);
```

See [pagination guide](guides/pagination.md) for more info.

### paginated(paginationfield) {#paginated}

Creates a new endpoint with an extra `paginationfield` string that will be used to find the specific
page, to append to this endpoint. See [Infinite Scrolling Pagination](guides/pagination.md#infinite-scrolling) for more info.

```ts
const getNextPage = getList.paginated('cursor');
```

Schema must also contain a [Collection](./Collection.md)

### paginated(removeCursor) {#paginated-function}

```typescript
function paginated<E, A extends any[]>(
  this: E,
  removeCursor: (...args: A) => readonly [...Parameters<E>],
): PaginationEndpoint<E, A>;
```

The function form allows any argument processing. This is the equivalent of sending `cursor` string like above.

```ts
const getNextPage = getList.paginated(
  ({ cursor, ...rest }: { cursor: string | number }) =>
    (Object.keys(rest).length ? [rest] : []) as any,
);
```

`removeCusor` is a function that takes the arguments sent in fetch of `getNextPage` and returns
the arguments to update `getList`.

Schema must also contain a [Collection](./Collection.md)

## Inheritance

Make sure you use `RestGenerics` to keep types working.

```ts
import { RestEndpoint, type RestGenerics } from '@data-client/rest';

class GithubEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  urlPrefix = 'https://api.github.com';

  getHeaders(headers: HeadersInit): HeadersInit {
    return {
      ...headers,
      'Access-Token': getAuth(),
    };
  }
}
```
