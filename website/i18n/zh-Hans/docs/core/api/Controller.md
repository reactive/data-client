---
title: Controller - 类型安全的命令式 store 访问
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

`Controller` 是一个单例，提供对 Reactive Data Client [flux store 及其生命周期](./Manager.md#control-flow)的安全访问。
`Controller` 会对所有 store 访问进行记忆化，从而保证全局引用相等，并提供最快的渲染
和读取性能。

`Controller` 会提供给：

- [Manager](./Manager.md)：作为 [Manager.middleware](./Manager.md#middleware) 的第一个参数
- :react[React]:vue[Vue]：通过 [useController()](./useController.md)
- :react[[hook 的单元测试](../guides/unit-testing-hooks.md)：通过 [renderDataHook()](./renderDataHook.md#controller)]:vue[[composable 的单元测试](../guides/unit-testing-composables.md)：通过 `@data-client/vue/test` 中的 `renderDataCompose()`]

```ts
class Controller {
  /*************** Action Dispatchers ***************/
  fetch(endpoint, ...args): ReturnType<E>;
  fetchIfStale(endpoint, ...args): ReturnType<E> | undefined;
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

## Action 派发方法 {#action-dispatchers}

### fetch(endpoint, ...args) {#fetch}

使用给定参数获取 endpoint，并在完成时用响应或错误
更新 Reactive Data Client 缓存。

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

`fetch` 的返回值与传给它的 [Endpoint](/rest/api/Endpoint) 相同。
使用 schema 时，返回的是反规范化后的值

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

#### Endpoint.sideEffect {#endpointsideeffect}

[sideEffect](/rest/api/Endpoint#sideeffect) 会改变其行为

##### true {#true}

- 在[提交](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom) Reactive Data Client 缓存更新*之前* resolve。（React 16、17）
- 每次调用都一定会发起新的获取。

##### false | undefined {#false--undefined}

- 在[提交](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom) Reactive Data Client 缓存更新*之后* resolve。
- 相同的请求会在全局范围内去重；同一时间只允许一个进行中的请求。
  - 若要确保发起一个*新的*请求，请务必先中止所有进行中的请求。

### fetchIfStale(endpoint, ...args) {#fetchIfStale}

仅当 endpoint 被视为“[过时](../concepts/expiry-policy.md#stale)”时才获取。

这在预取数据时很有用，因为它可以避免重复获取仍然新鲜的数据。

下面是一个配合“边渲染边获取”（fetch-as-you-render）路由的[示例](https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?file=src%2Frouting%2Froutes.tsx)：

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

将所有匹配 `testKey` 的响应的[过期状态](../concepts/expiry-policy.md)设为 [Stale](../concepts/expiry-policy.md#stale)。

当缓存中存在许多不同参数组合时，这可以用来只刷新
当前正在显示的数据。

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

为了减少负载、提升性能并改善状态一致性，通常更好的做法是
[在变更响应中包含变更的副作用](/rest/guides/side-effects)。

:::

### invalidate(endpoint, ...args) {#invalidate}

强制使用相同 Endpoint 和参数的 [useSuspense](./useSuspense.md) 重新获取:react[并触发 suspense]。
:vue[已挂载的组件会[继续显示当前数据](../concepts/expiry-policy.md#invalidate)，
直到重新获取完成。]

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

::::react

:::tip

如果想在刷新的同时继续显示过时数据，请使用 [Controller.fetch](#fetch)。

:::

::::

:::tip[一次使多个 endpoint 失效]

使用 [schema.Invalidate](/rest/api/Invalidate) 可以使所有包含某个 Entity 的 endpoint 失效。

对于 REST，可以尝试使用 [Resource.delete](/rest/api/resource#delete)

```ts
// deletes MyResource(5)
// this will refetch MyResource.get({id: '5'})
// and remove it from MyResource.getList
controller.setResponse(MyResource.delete, { id: '5' }, { id: '5' });
```

:::

### invalidateAll(\{ testKey }) {#invalidateAll}

使所有匹配 `testKey` 的 [endpoint key](/rest/api/RestEndpoint#key) [失效](../concepts/expiry-policy#invalid)。

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

如果想在刷新的同时继续显示过时数据，请改用 [Controller.expireAll](#expireAll)。

:::

::::

这里我们只清除使用 test.com 域名的 GET endpoint。这意味着其他域名的数据仍保留在缓存中。

```ts
const myDomain = 'http://test.com';
const testKey = (key: string) => key.startsWith(`GET ${myDomain}`);

function useLogout() {
  const ctrl = useController();
  return () => ctrl.invalidateAll({ testKey });
}
```

通常最好也使用 [LogoutManager](./LogoutManager.md)，在遇到 401（未授权）时
清除缓存。

<ProviderManagers imports={['LogoutManager', 'getDefaultManagers']}>

```ts
import { unAuth } from '../authentication';

const myDomain = 'http://test.com';
const testKey = (key: string) => key.startsWith(`GET ${myDomain}`);

const managers = [
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

重置/清空整个 Reactive Data Client 缓存。所有进行中的请求都不会 resolve。

通常在退出登录或切换已认证用户时使用。

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

更新任意 [Queryable](/rest/api/schema#queryable) [Schema](/rest/api/schema#schema-overview)，或者通过 [Array](/rest/api/Array) 或 [Values](/rest/api/Values) schema 一次更新多个 Entity。

```ts
ctrl.set(
  Todo,
  // which Todo to update
  { id: '5' },
  // merge this data into the Todo in the store
  { id: '5', title: 'tell me friends how great Data Client is' },
);
```

value 的类型由 schema 决定：[Entity](/rest/api/Entity) 接收其字段（数字和字符串可以互换），
而 [Collection](/rest/api/Collection) 或 [All](/rest/api/All) 接收一个行列表。[Query](/rest/api/Query)
接收其所包裹 schema 的输入，因为 `set()` 是对该 schema 进行规范化，而不是逆向执行 `process()`。

```ts
ctrl.set(TodoResource.getList.schema, [{ id: '5', completed: true }]);
```

:::note Unions

当每个成员都把其判别字段声明为字面量（例如 `readonly type = 'first'`）时，
[Union](/rest/api/Union) 的每一行都会按其选中的成员进行检查，因此 `{ type: 'first', secondField: 1 }` 会
报错。只接受已声明的字段，因此被
`schemaAttribute` 函数读取的键必须在每个成员上声明。

:::

当使用派生数据时，value 中可以使用函数。这可以[防止竞态条件](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state)。

```ts
const id = '2';
ctrl.set(Article, { id }, article => ({ id, votes: article.votes + 1 }));
```

#### set([Entity], rows) {#set-array}

传入一个 [Array](/rest/api/Array) schema（`[Todo]` 或 `new schema.Array(Todo)`）和一个行列表，即可在
一次 store 更新中更新多个 Entity。每一行都会与已存储的对应 Entity 合并；不在列表中的 Entity 保持不变。

```ts
ctrl.set(
  [Todo],
  [
    { id: '5', completed: true },
    { id: '6', completed: false },
  ],
);
```

行的类型由 Entity 的字段决定；数字和字符串可以互换，而对象、数组和 Date 值不会被
检查，因为行是原始输入。

对于混合了多种 Entity 类型的列表，请使用 [Union](/rest/api/Union)；每一行会按其 `type` 存储：

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

要一次删除多个 Entity，请使用 [Invalidate](/rest/api/Invalidate#batch-invalidation)；每一行只需包含其 pk
字段：

```ts
ctrl.set([new schema.Invalidate(Todo)], [{ id: '5' }, { id: '6' }]);
```

要删除单个 Entity，传入 Invalidate schema 及其对应的行：

```ts
ctrl.set(new schema.Invalidate(Todo), { id: '5' });
```

[Values](/rest/api/Values) schema 则接收一个由行组成的对象：

```ts
ctrl.set(new schema.Values(Todo), {
  '5': { id: '5', completed: true },
  '6': { id: '6', completed: false },
});
```

Array、Values 和 Invalidate schema 不接受 `args`（因此 [Entity.pk()](/rest/api/Entity#pk) 和 [Entity.process()](/rest/api/Entity#process)
收到的是 `[]`），也不接受更新函数。pk 相同的行会按列表顺序合并，不会经过
[Entity.shouldReorder()](/rest/api/Entity#shouldreorder)。请用它来代替逐行调用 `set()`，例如在
[批量处理高频数据流更新](../concepts/managers.md#batching)时。

:::react

<BatchSetDemo />

:::

### setResponse(endpoint, ...args, response) {#setResponse}

把 `response` 存入给定 [Endpoint](/rest/api/Endpoint) 和参数对应的缓存中。

所有因给定 [Endpoint](/rest/api/Endpoint) 和参数而挂起的组件都会 resolve。

如果给定 [Endpoint](/rest/api/Endpoint) 和参数已有数据，则会更新它。

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

这里展示的是在 :react[React]:vue[Vue] 中的概念验证；不过[基于 Manager 的 websocket 实现](../concepts/managers.md#data-stream)
会健壮得多。

### setError(endpoint, ...args, error) {#setError}

把 [Endpoint](/rest/api/Endpoint) 和参数对应的结果存储为所提供的错误。

### resolve(endpoint, \{ args, response, fetchedAt, error }) {#resolve}

resolve 某次特定的获取，并把 `response` 存入缓存。

它与 setResponse 类似，区别在于它会触发某个进行中获取的 resolve。
这意味着对应的乐观更新将不再生效。

[NetworkManager](./NetworkManager.md) 中使用了它，处理获取请求时
也应当使用它。

### subscribe(endpoint, ...args) {#subscribe}

标记对给定 [Endpoint](/rest/api/Endpoint) 的一个新订阅。这应当使订阅计数加一。

[useSubscription](./useSubscription.md) 和 [useLive](./useLive.md) 会在挂载时调用它。

这对于需要根据其他因素订阅/取消订阅的自定义 :react[hook]:vue[composable] 可能很有用。

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

标记对给定 [Endpoint](/rest/api/Endpoint) 的订阅结束。这应当
使订阅计数减一；当计数降到 0 时，将不再自动接收后续更新。

[useSubscription](./useSubscription.md) 和 [useLive](./useLive.md) 会在卸载时调用它。

## 数据访问 {#data-access}

### get(schema, ...args, state) {#get}

在 `state` 中查找任意 [Queryable](/rest/api/schema#queryable) [Schema](/rest/api/schema#schema-overview)。

#### Example {#example}

[useQuery](./useQuery.md) 中使用了它，你也可以在
[Manager](./Manager.md) 中使用它来安全地访问 store。

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

在组件中，[useQuery()](./useQuery.md) 会让结果保持响应式。在事件处理函数中，传入
[getState()](#getState) 来读取最新的 store：

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

从给定的状态中获取指定 endpoint/args 组合对应的响应（具有全局引用稳定性）。

#### data {#data}

反规范化后的响应数据。保证所有成员都具有全局引用稳定性。

#### [expiryStatus](../concepts/expiry-policy.md#expiry-status) {#expirystatus}

```ts
export enum ExpiryStatus {
  Invalid = 1,
  InvalidIfStale,
  Valid,
}
```

##### Valid {#valid}

- 永远不会挂起。
- 数据过时时可能会获取

##### InvalidIfStale {#invalidifstale}

- 数据过时时会挂起。
- 数据过时时可能会获取

##### Invalid {#invalid}

- 总是会挂起
- 总是会获取

#### expiresAt {#expiresat}

表示过期时间的数字。可与 Date.now() 进行比较。

#### Example {#example-1}

[useCache](./useCache.md) 和 [useSuspense](./useSuspense.md) 中使用了它，你也可以在
[Manager](./Manager.md) 中用它根据给定的状态查找响应。

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

在事件处理函数中，传入 [getState()](#getState) 来读取最新的 store，如
[getState() 示例](#getState)所示。

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

获取指定 endpoint 的错误（如果有）。没有错误时返回 undefined。

### snapshot(state, fetchedAt) {#snapshot}

返回一个 [Snapshot](./Snapshot.md)。

### getState() {#getState}

获取 Reactive Data Client 中*已经*[提交](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom)的内部状态。

::::warning

它只应在事件处理函数或 [Manager](./Manager.md) 中使用。

:::react

在 React 的渲染生命周期中使用 getState() 可能导致数据撕裂（tearing）。

:::

:::vue

在 `computed()` 或模板中使用 getState()，store 变化时不会更新。在这些地方请改用
[useQuery()](./useQuery.md) 或 [useCache()](./useCache.md)。

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

[变更](#endpointsideeffect)会在 store 更新*之前* resolve，因此请从
`fetch()` resolve 的值中读取结果，而不是从 `getState()` 中读取。

:::
