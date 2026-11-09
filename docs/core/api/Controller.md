---
title: Controller - Typesafe imperative store access
sidebar_label: Controller
---

import ProviderManagers from '../shared/_provider_managers.mdx';

<head>
  <meta name="docsearch:pagerank" content="30"/>
</head>

import LanguageTabs from '@site/src/components/LanguageTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import StackBlitz from '@site/src/components/StackBlitz';
import BatchSetDemo from '../shared/\_BatchSetDemo.mdx';

# Controller

`Controller` gives type-safe access to the Reactive Data Client [store and its lifecycle](./Manager.md#control-flow).
Each store has one `Controller`.

`Controller` memoizes all store reads, so equal data keeps the same object reference everywhere. This keeps rendering
and lookups fast.

`Controller` is provided:

- [Managers](./Manager.md) as the first argument in [Manager.middleware](./Manager.md#middleware)
- :react[React]:vue[Vue] with [useController()](./useController.md)
- :react[[Unit testing hooks](../guides/unit-testing-hooks.md) with [renderDataHook()](./renderDataHook.md#controller)]:vue[[Unit testing composables](../guides/unit-testing-composables.md) with `renderDataCompose()` from `@data-client/vue/test`]

```ts
class Controller {
  /*************** Action Dispatchers ***************/
  fetch(endpoint, ...args): ReturnType<E>;
  fetchIfStale(endpoint, ...args): ReturnType<E> | Denormalize<E['schema']>;
  expireAll({ testKey }): Promise<void>;
  invalidate(endpoint, ...args): Promise<void>;
  invalidateAll({ testKey }): Promise<void>;
  resetEntireStore(): Promise<void>;
  set(queryable, ...args, value): Promise<void>;
  set([Entity], rows): Promise<void>;
  setResponse(endpoint, ...args, response): Promise<void>;
  setError(endpoint, ...args, error): Promise<void>;
  resolve(endpoint, { args, response, fetchedAt, error }): Promise<void>;
  subscribe(endpoint, ...args): Promise<void>;
  unsubscribe(endpoint, ...args): Promise<void>;
  /*************** Data Access ***************/
  get(queryable, ...args, state): Denormalized<typeof queryable>;
  getResponse(endpoint, ...args, state): { data; expiryStatus; expiresAt };
  getError(endpoint, ...args, state): ErrorTypes | undefined;
  snapshot(state: State<unknown>, fetchedAt?: number): SnapshotInterface;
  getState(): State<unknown>;
}
```

## Action Dispatchers

### fetch(endpoint, ...args) {#fetch}

Fetches the endpoint with the given args. When the fetch completes, the response or error goes into the cache.

<Tabs
defaultValue="Create"
values={[
{ label: 'Create', value: 'Create' },
{ label: 'Update', value: 'Update' },
{ label: 'Delete', value: 'Delete' },
]}>
<TabItem value="Create">

:::react

```tsx
import { useController } from '@data-client/react';
import { PostResource } from './PostResource';

function CreatePost() {
  const ctrl = useController();

  return (
    <form
      onSubmit={e =>
        ctrl.fetch(PostResource.getList.push, new FormData(e.currentTarget))
      }
    >
      {/* ... */}
    </form>
  );
}
```

:::

:::vue

```html title="CreatePost.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { PostResource } from './PostResource';

  const ctrl = useController();

  const handleSubmit = (e: Event) =>
    ctrl.fetch(
      PostResource.getList.push,
      new FormData(e.target as HTMLFormElement),
    );
</script>

<template>
  <form @submit.prevent="handleSubmit"><!-- ... --></form>
</template>
```

:::

</TabItem>
<TabItem value="Update">

:::react

```tsx
import { useController } from '@data-client/react';
import { PostResource } from './PostResource';

function UpdatePost({ id }: { id: string }) {
  const ctrl = useController();

  return (
    <form
      onSubmit={e =>
        ctrl.fetch(PostResource.update, { id }, new FormData(e.currentTarget))
      }
    >
      {/* ... */}
    </form>
  );
}
```

:::

:::vue

```html title="UpdatePost.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { PostResource } from './PostResource';

  const props = defineProps<{ id: string }>();
  const ctrl = useController();

  const handleSubmit = (e: Event) =>
    ctrl.fetch(
      PostResource.update,
      { id: props.id },
      new FormData(e.target as HTMLFormElement),
    );
</script>

<template>
  <form @submit.prevent="handleSubmit"><!-- ... --></form>
</template>
```

:::

</TabItem>
<TabItem value="Delete">

:::react

```tsx
import { useController } from '@data-client/react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Post, PostResource } from './PostResource';

function PostListItem({ post }: { post: Post }) {
  const ctrl = useController();
  const navigate = useNavigate();

  const handleDelete = useCallback(
    async e => {
      await ctrl.fetch(PostResource.delete, { id: post.id });
      navigate('/');
    },
    [ctrl, post.id],
  );

  return (
    <div>
      <h3>{post.title}</h3>
      <button onClick={handleDelete}>X</button>
    </div>
  );
}
```

:::

:::vue

```html title="PostListItem.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { useRouter } from 'vue-router';
  import { Post, PostResource } from './PostResource';

  const props = defineProps<{ post: Post }>();
  const ctrl = useController();
  const router = useRouter();

  const handleDelete = async () => {
    await ctrl.fetch(PostResource.delete, { id: props.post.id });
    router.push('/');
  };
</script>

<template>
  <div>
    <h3>{{ post.title }}</h3>
    <button @click="handleDelete">X</button>
  </div>
</template>
```

:::

</TabItem>
</Tabs>

:::tip

`fetch` has the same return value as the [Endpoint](/rest/api/Endpoint) passed to it.
With a schema, it returns the denormalized value.

```ts
const controller = useController();

const post = await controller.fetch(
  PostResource.getList.push,
  createPayload,
);
post.title;
post.pk();
```

:::

#### Endpoint.sideEffect

[sideEffect](/rest/api/Endpoint#sideeffect) changes how `fetch()` behaves:

##### true

- Resolves _before_ the cache update is [committed](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom).
- Every call starts a new fetch.

##### false | undefined

- Resolves _after_ the cache update is [committed](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom).
- Identical requests are deduplicated, so only one is in flight at a time.
  - To start a _new_ request, abort the one in flight first.

### fetchIfStale(endpoint, ...args) {#fetchIfStale}

Fetches only if endpoint is considered '[stale](../concepts/expiry-policy.md#stale)' or [invalid](../concepts/expiry-policy.md#invalid),
returning the same Promise as [fetch()](#fetch). Otherwise returns the cached data synchronously, without fetching.

Use it to prefetch without refetching fresh data.

An [example](https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?file=src%2Frouting%2Froutes.tsx) with a fetch-as-you-render router:

```ts
{
  name: 'IssueList',
  component: lazyPage('IssuesPage'),
  title: 'issue list',
  resolveData: async (
    controller: Controller,
    { owner, repo }: { owner: string; repo: string },
    searchParams: URLSearchParams,
  ) => {
    const q = searchParams?.get('q') || 'is:issue is:open';
    // highlight-start
    await controller.fetchIfStale(IssueResource.search, {
      owner,
      repo,
      q,
    });
    // highlight-end
  },
},
```

:::react

<StackBlitz app="github-app" file="src/routing/routes.tsx" view="editor" />

:::

### expireAll(\{ testKey }) {#expireAll}

Sets all responses' [expiry status](../concepts/expiry-policy.md) matching `testKey` to [Stale](../concepts/expiry-policy.md#stale).

Use it to refresh only the data on screen when the cache holds many sets of args.

:::react

```tsx
import { type Controller, useController } from '@data-client/react';
import { AccountResource, TradeResource, type Trade } from './resources';
import { Form, FormField } from './Form';

const createTradeHandler =
  (ctrl: Controller, userId: string) => async (trade: Trade) => {
    await ctrl.fetch(TradeResource.getList.push, { user: userId }, trade);
    // highlight-start
    ctrl.expireAll(AccountResource.get);
    ctrl.expireAll(AccountResource.getList);
    // highlight-end
  };

function CreateTrade({ userId }: { userId: string }) {
  const handleTrade = createTradeHandler(useController(), userId);

  return (
    <Form onSubmit={handleTrade}>
      <FormField name="ticker" />
      <FormField name="amount" type="number" />
      <FormField name="price" type="number" />
    </Form>
  );
}
```

:::

:::vue

```html title="CreateTrade.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { AccountResource, TradeResource, type Trade } from './resources';
  import TradeForm from './TradeForm.vue';

  const props = defineProps<{ userId: string }>();
  const ctrl = useController();

  const handleTrade = async (trade: Trade) => {
    await ctrl.fetch(
      TradeResource.getList.push,
      { user: props.userId },
      trade,
    );
    // highlight-start
    ctrl.expireAll(AccountResource.get);
    ctrl.expireAll(AccountResource.getList);
    // highlight-end
  };
</script>

<template>
  <TradeForm @submit="handleTrade" />
</template>
```

:::

:::tip

Often it is better to [include mutation side effects in the mutation response](/rest/guides/side-effects). This
reduces load, improves performance and keeps state consistent.

:::

### invalidate(endpoint, ...args) {#invalidate}

Forces refetching :react[and suspense ]on [useSuspense](./useSuspense.md) with the same Endpoint
and parameters.:vue[ Mounted components [keep showing their current data](../concepts/expiry-policy.md#invalidate)
until the refetch resolves.]

:::react

```tsx
import { useController, useSuspense } from '@data-client/react';
import { ArticleResource } from './ArticleResource';

function ArticleName({ id }: { id: string }) {
  const article = useSuspense(ArticleResource.get, { id });
  const ctrl = useController();

  return (
    <div>
      <h1>{article.title}</h1>
      <button onClick={() => ctrl.invalidate(ArticleResource.get, { id })}>
        Fetch &amp; suspend
      </button>
    </div>
  );
}
```

:::

:::vue

```html title="ArticleName.vue"
<script setup lang="ts">
  import { useController, useSuspense } from '@data-client/vue';
  import { ArticleResource } from './ArticleResource';

  const props = defineProps<{ id: string }>();
  const ctrl = useController();
  const article = await useSuspense(ArticleResource.get, () => ({
    id: props.id,
  }));
</script>

<template>
  <div>
    <h1>{{ article.title }}</h1>
    <button @click="ctrl.invalidate(ArticleResource.get, { id })">
      Refetch
    </button>
  </div>
</template>
```

:::

::::vue

:::tip[Show the Suspense fallback again]

Remount the component with a new `key` after invalidating; the new instance suspends on the invalid data.
`timeout="0"` makes `<Suspense>` show its fallback while it waits instead of the old content. Remounting
resets the component's local state.

```html title="ArticlePage.vue"
<script setup lang="ts">
  import { ref } from 'vue';
  import { useController } from '@data-client/vue';
  import { ArticleResource } from './ArticleResource';
  import ArticleName from './ArticleName.vue';

  const props = defineProps<{ id: string }>();
  const ctrl = useController();
  const remountKey = ref(0);

  async function reload() {
    await ctrl.invalidate(ArticleResource.get, { id: props.id });
    remountKey.value++;
  }
</script>

<template>
  <button @click="reload">Reload</button>
  <Suspense timeout="0">
    <ArticleName :key="remountKey" :id="id" />
    <template #fallback><Loading /></template>
  </Suspense>
</template>
```

:::

::::

::::react

:::tip

To refresh while still showing stale data, use [Controller.fetch](#fetch).

:::

::::

:::tip[Invalidate many endpoints at once]

Use [schema.Invalidate](/rest/api/Invalidate) to invalidate every endpoint that contains a given entity.

For REST, try [Resource.delete](/rest/api/resource#delete).

```ts
// deletes MyResource(5)
// this will refetch MyResource.get({id: '5'})
// and remove it from MyResource.getList
controller.setResponse(MyResource.delete, { id: '5' }, { id: '5' });
```

:::

### invalidateAll(\{ testKey }) {#invalidateAll}

[Invalidates](../concepts/expiry-policy.md#invalid) all [endpoint keys](/rest/api/RestEndpoint#key) matching `testKey`.

:::react

```tsx
import { useController, useSuspense } from '@data-client/react';
import { ArticleResource } from './ArticleResource';

function ArticleName({ id }: { id: string }) {
  const article = useSuspense(ArticleResource.get, { id });
  const ctrl = useController();

  return (
    <div>
      <h1>{article.title}</h1>
      <button onClick={() => ctrl.invalidateAll(ArticleResource.get)}>
        Fetch &amp; suspend
      </button>
    </div>
  );
}
```

:::

:::vue

```html title="ArticleName.vue"
<script setup lang="ts">
  import { useController, useSuspense } from '@data-client/vue';
  import { ArticleResource } from './ArticleResource';

  const props = defineProps<{ id: string }>();
  const ctrl = useController();
  const article = await useSuspense(ArticleResource.get, () => ({
    id: props.id,
  }));
</script>

<template>
  <div>
    <h1>{{ article.title }}</h1>
    <button @click="ctrl.invalidateAll(ArticleResource.get)">
      Refetch
    </button>
  </div>
</template>
```

:::

::::react

:::tip

To refresh while still showing stale data, use [Controller.expireAll](#expireAll) instead.

:::

::::

This clears only GET endpoints on the test.com domain. Other domains stay in the cache.

```ts
const myDomain = 'http://test.com';
const testKey = (key: string) => key.startsWith(`GET ${myDomain}`);

function useLogout() {
  const ctrl = useController();
  return () => ctrl.invalidateAll({ testKey });
}
```

Also clear the cache on 401 (unauthorized) with [LogoutManager](./LogoutManager.md).

<ProviderManagers imports={['LogoutManager', 'getDefaultManagers']}>

```ts
import { unAuth } from '../authentication';

const myDomain = 'http://test.com';
const testKey = (key: string) => key.startsWith(`GET ${myDomain}`);

const managers = () => [
  new LogoutManager({
    handleLogout(controller) {
      // call custom unAuth function we defined
      unAuth();
      // still reset the store
      controller.invalidateAll({ testKey });
    },
  }),
  ...getDefaultManagers(),
];
```

</ProviderManagers>

### resetEntireStore() {#resetEntireStore}

Clears the entire Reactive Data Client cache. Fetches in flight reject with a `ResetError`, and their responses are not
stored.

Use it when a user logs out or the authenticated user changes.

:::react

```tsx
import { useController, useSuspense } from '@data-client/react';
import { useCallback } from 'react';
import { CurrentUserResource } from './CurrentUserResource';
import { impersonateUser } from './auth';

const USER_NUMBER_ONE: string = '1111';

function UserName() {
  const user = useSuspense(CurrentUserResource.get);
  const ctrl = useController();

  const becomeAdmin = useCallback(() => {
    // Changes the current user
    impersonateUser(USER_NUMBER_ONE);
    // highlight-next-line
    ctrl.resetEntireStore();
  }, [ctrl]);
  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={becomeAdmin}>Be Number One</button>
    </div>
  );
}
```

:::

:::vue

```html title="UserName.vue"
<script setup lang="ts">
  import { useController, useSuspense } from '@data-client/vue';
  import { CurrentUserResource } from './CurrentUserResource';
  import { impersonateUser } from './auth';

  const USER_NUMBER_ONE: string = '1111';

  const user = await useSuspense(CurrentUserResource.get);
  const ctrl = useController();

  const becomeAdmin = () => {
    // Changes the current user
    impersonateUser(USER_NUMBER_ONE);
    // highlight-next-line
    ctrl.resetEntireStore();
  };
</script>

<template>
  <div>
    <h1>{{ user.name }}</h1>
    <button @click="becomeAdmin">Be Number One</button>
  </div>
</template>
```

:::

### set(queryable, ...args, value) {#set}

Updates any [Queryable](/rest/api/schema#queryable) [Schema](/rest/api/schema#schema-overview), or many entities at once with an [Array](/rest/api/Array) or [Values](/rest/api/Values) schema.

```ts
ctrl.set(
  Todo,
  // which Todo to update
  { id: '5' },
  // merge this data into the Todo in the store
  { id: '5', title: 'tell me friends how great Data Client is' },
);
```

The value is typed by the schema: an [Entity](/rest/api/Entity) takes its fields (numbers and strings may be either),
while a [Collection](/rest/api/Collection) or [All](/rest/api/All) takes a list of rows. A [Query](/rest/api/Query)
takes the input of the schema it wraps, since `set()` normalizes that schema rather than reversing `process()`.

```ts
ctrl.set(TodoResource.getList.schema, [{ id: '5', completed: true }]);
```

[Collection.push](/rest/api/Collection#push) and [unshift](/rest/api/Collection#unshift) take the Collection's args,
which pick the lists to add to, and one row or a list of rows.

```ts
ctrl.set(TodoResource.getList.schema.push, { userId: '1' }, [
  { id: '6', title: 'Buy milk' },
  { id: '7', title: 'Walk dog' },
]);
```

:::note Unions

When each member declares its discriminator as a literal (like `readonly type = 'first'`), a
[Union](/rest/api/Union) row is checked against the member it selects, so `{ type: 'first', secondField: 1 }` is an
error. Only declared fields are accepted, so a key read by a
`schemaAttribute` function must be declared on each member.

:::

Functions can be used in the value when derived data is used. This [prevents race conditions](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state).

```ts
const id = '2';
ctrl.set(Article, { id }, article => ({ id, votes: article.votes + 1 }));
```

#### set([Entity], rows) {#set-array}

Pass an [Array](/rest/api/Array) schema (`[Todo]` or `new schema.Array(Todo)`) and a list of rows to update
many entities in one store update. Each row merges with its stored entity; entities not in the list are untouched.

```ts
ctrl.set(
  [Todo],
  [
    { id: '5', completed: true },
    { id: '6', completed: false },
  ],
);
```

Rows are typed by the Entity's fields; numbers and strings may be either, and object, array and Date values are not
checked since rows are raw input.

For lists that mix Entity types, use a [Union](/rest/api/Union); each row is stored by its `type`:

```ts
const Feed = new schema.Union({ post: Post, comment: Comment }, 'type');

ctrl.set(
  [Feed],
  [
    { id: '1', type: 'post', title: 'Hello' },
    { id: '7', type: 'comment', body: 'Nice!' },
  ],
);
```

To delete many entities at once, use [Invalidate](/rest/api/Invalidate#batch-invalidation); rows only need their pk
fields:

```ts
ctrl.set([new schema.Invalidate(Todo)], [{ id: '5' }, { id: '6' }]);
```

To delete one, pass the Invalidate schema and its row:

```ts
ctrl.set(new schema.Invalidate(Todo), { id: '5' });
```

[Values](/rest/api/Values) schemas take an object of rows instead:

```ts
ctrl.set(new schema.Values(Todo), {
  '5': { id: '5', completed: true },
  '6': { id: '6', completed: false },
});
```

Array, Values and Invalidate schemas take no `args` (so [Entity.pk()](/rest/api/Entity#pk) and [Entity.process()](/rest/api/Entity#process)
receive `[]`) and no updater function. Rows that share a pk merge in list order, without
[Entity.shouldReorder()](/rest/api/Entity#shouldreorder). Use this instead of calling `set()` once per row, such as when
[batching high-frequency stream updates](../concepts/managers.md#batching).

:::react

<BatchSetDemo />

:::

### setResponse(endpoint, ...args, response) {#setResponse}

Stores `response` in cache for given [Endpoint](/rest/api/Endpoint) and args.

Components suspending on this [Endpoint](/rest/api/Endpoint) and args resolve. Existing data for them is updated.

:::react

```tsx
import { useController } from '@data-client/react';
import { useEffect } from 'react';
import { EndpointLookup } from './EndpointLookup';

function useWebsocketUpdates(url: string) {
  const ctrl = useController();

  useEffect(() => {
    const websocket = new WebSocket(url);

    websocket.onmessage = event => {
      const { endpoint, args, data } = JSON.parse(event.data);
      ctrl.setResponse(EndpointLookup[endpoint], ...args, data);
    };

    return () => websocket.close();
  }, [ctrl, url]);
}
```

:::

:::vue

```ts
const ctrl = useController();
let websocket: WebSocket;

onMounted(() => {
  websocket = new WebSocket(url);

  websocket.onmessage = event =>
    ctrl.setResponse(
      EndpointLookup[event.endpoint],
      ...event.args,
      event.data,
    );
});

onUnmounted(() => websocket.close());
```

:::

This is a proof of concept in :react[React]:vue[Vue]. A [Manager websockets implementation](../concepts/managers.md#data-stream)
is more robust.

### setError(endpoint, ...args, error) {#setError}

Stores `error` as the result of the [Endpoint](/rest/api/Endpoint) and args.

### resolve(endpoint, \{ args, response, fetchedAt, error }) {#resolve}

Resolves a specific fetch, storing the `response` in cache.

Like [setResponse](#setResponse), but it also settles the fetch in flight, so its optimistic update no longer
applies.

[NetworkManager](./NetworkManager.md) uses it. Use it when a Manager processes fetch requests.

Pass the fetch action's `action.meta.fetchedAt` as `fetchedAt`. Then the store drops responses to fetches started before
[resetEntireStore()](#resetEntireStore), and an old response doesn't settle a newer fetch of the same key.

### subscribe(endpoint, ...args) {#subscribe}

Adds a subscription to the [Endpoint](/rest/api/Endpoint) and args. Each call increments its subscriber count.

[useSubscription](./useSubscription.md) and [useLive](./useLive.md) call this on mount.

Custom :react[hooks]:vue[composables] can call it to subscribe based on other conditions.

:::react

```tsx
import {
  useController,
  type EndpointInterface,
  type FetchFunction,
  type Schema,
} from '@data-client/react';
import { useEffect } from 'react';

function useSubscribe<
  E extends EndpointInterface<FetchFunction, Schema | undefined, false | undefined>,
>(endpoint: E, ...args: readonly [...Parameters<E>]) {
  const controller = useController();
  const key = endpoint.key(...args);

  useEffect(() => {
    controller.subscribe(endpoint, ...args);
    return () => {
      controller.unsubscribe(endpoint, ...args);
    };
  }, [controller, key]);
}
```

:::

:::vue

```ts
const controller = useController();

// args can be a ref, computed or getter; this re-runs when it changes
watchEffect(onCleanup => {
  const currentArgs = toValue(args);
  controller.subscribe(endpoint, ...currentArgs);
  onCleanup(() => controller.unsubscribe(endpoint, ...currentArgs));
});
```

:::

### unsubscribe(endpoint, ...args) {#unsubscribe}

Removes a subscription to the [Endpoint](/rest/api/Endpoint) and args. Each call decrements its subscriber count; at
0, automatic updates stop.

[useSubscription](./useSubscription.md) and [useLive](./useLive.md) call this on unmount.

## Data Access

### get(schema, ...args, state) {#get}

Looks up any [Queryable](/rest/api/schema#queryable) [Schema](/rest/api/schema#schema-overview) in `state`.

#### Example

[useQuery](./useQuery.md) uses it, and [Managers](./Manager.md) can use it to read the store safely.

:::react

```tsx title="useQuery.ts"
import {
  useController,
  StateContext,
  type Queryable,
  type SchemaArgs,
  type DenormalizeNullable,
} from '@data-client/react';
import { useContext } from 'react';

/** Oversimplified useQuery */
function useQuery<S extends Queryable>(
  schema: S,
  ...args: SchemaArgs<S>
): DenormalizeNullable<S> | undefined {
  const state = useContext(StateContext);
  const controller = useController();

  return controller.get(schema, ...args, state);
}
```

:::

:::vue

In components, [useQuery()](./useQuery.md) keeps the result reactive. In event handlers, pass
[getState()](#getState) to read the latest store:

```ts
const ctrl = useController();

const toggle = (id: string) => {
  const todo = ctrl.get(Todo, { id }, ctrl.getState());
  if (todo) ctrl.set(Todo, { id }, { id, completed: !todo.completed });
};
```

:::

### getResponse(endpoint, ...args, state) {#getResponse}

```ts title="returns"
{
  data: DenormalizeNullable<E['schema']>;
  expiryStatus: ExpiryStatus;
  expiresAt: number;
}
```

Gets the response for an endpoint and args from the given `state`. The result is referentially stable.

#### data

The denormalized response. Every member keeps the same reference while its data is unchanged.

#### [expiryStatus](../concepts/expiry-policy.md#expiry-status)

```ts
export enum ExpiryStatus {
  Invalid = 1,
  InvalidIfStale,
  Valid,
}
```

##### Valid

- Will never suspend.
- Might fetch if data is stale

##### InvalidIfStale

- Will suspend if data is stale.
- Might fetch if data is stale

##### Invalid

- Will always suspend:vue[ during setup; mounted components [keep their current data](../concepts/expiry-policy.md#invalidate) until the refetch resolves]
- Will always fetch

#### expiresAt

When the data expires, as a timestamp. Compare it to `Date.now()`.

#### Example

[useCache](./useCache.md) and [useSuspense](./useSuspense.md) use it. [Managers](./Manager.md) can use it to look up a
response in the given state.

:::react

```tsx title="useCache.ts"
import {
  useController,
  StateContext,
  type EndpointInterface,
} from '@data-client/react';
import { useContext } from 'react';

/** Oversimplified useCache */
function useCache<E extends EndpointInterface>(
  endpoint: E,
  ...args: readonly [...Parameters<E>]
) {
  const state = useContext(StateContext);
  const controller = useController();
  return controller.getResponse(endpoint, ...args, state).data;
}
```

:::

:::vue

In event handlers, pass [getState()](#getState) to read the latest store, as in the
[getState() example](#getState).

:::

```tsx title="MyManager.ts" framework-imports
import {
  type Manager,
  type Middleware,
  actionTypes,
} from '@data-client/react';

export default class MyManager implements Manager {
  declare protected websocket: WebSocket;

  middleware: Middleware = controller => {
    return next => async action => {
      if (action.type === actionTypes.FETCH) {
        console.log('The existing response of the requested fetch');
        console.log(
          controller.getResponse(
            action.endpoint,
            ...action.args,
            controller.getState(),
          ).data,
        );
      }
      next(action);
    };
  };

  cleanup() {
    this.websocket.close();
  }
}
```

### getError(endpoint, ...args, state) {#getError}

Gets the error for an endpoint and args, or `undefined` if there is none.

### snapshot(state, fetchedAt) {#snapshot}

Returns a [Snapshot](./Snapshot.md).

### getState() {#getState}

Gets the internal state of Reactive Data Client that has _already been [committed](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom)_.

::::warning

Use it only in event handlers or [Managers](./Manager.md).

:::react

Calling getState() during render can cause data tearing.

:::

:::vue

Using getState() in a `computed()` or template won't update when the store changes. Use
[useQuery()](./useQuery.md) or [useCache()](./useCache.md) there instead.

:::

::::

:::react

```tsx
import { useController } from '@data-client/react';
import { useCallback } from 'react';
import { MyResource } from './resources/MyResource';
import { redirect } from './routing';

function useUpdateHandler(id: string) {
  const controller = useController();

  return useCallback(
    async updatePayload => {
      const response = await controller.fetch(
        MyResource.update,
        { id },
        updatePayload,
      );
      // the fetch has completed, but react has not yet re-rendered
      // this lets use sequence after the next re-render
      // we're working on a better solution to this specific case
      setTimeout(() => {
        const { data: denormalized } = controller.getResponse(
          MyResource.update,
          { id },
          updatePayload,
          controller.getState(),
        );
        redirect(denormalized.getterUrl);
      }, 40);
    },
    [id],
  );
}
```

:::

:::vue

```ts
const controller = useController();

const handleShare = () => {
  // reads the latest store without making this handler reactive
  const { data: article } = controller.getResponse(
    ArticleResource.get,
    { id: props.id },
    controller.getState(),
  );
  if (article) navigator.share({ title: article.title, url: article.url });
};
```

[Mutations](#endpointsideeffect) resolve _before_ the store is updated, so read their result from
the value `fetch()` resolves with rather than `getState()`.

:::
