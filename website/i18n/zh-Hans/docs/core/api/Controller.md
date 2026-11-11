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

`Controller` 提供对 Reactive Data Client [store 及其生命周期](./Manager.md#control-flow)的类型安全访问。
每个 store 有一个 `Controller`。

`Controller` 会对反规范化进行记忆化，以保证全局引用相等：未变化的 store 数据无论在哪里读取，都会得到同一个对象。
这让渲染和查找保持快速。

`Controller` 会提供给：

- [Manager](./Manager.md)：作为 [Manager.middleware](./Manager.md#middleware) 的第一个参数
- :react[React]:vue[Vue]：通过 [useController()](./useController.md)
- :react[[hook 的单元测试](../guides/unit-testing-hooks.md)：通过 [renderDataHook()](./renderDataHook.md#controller)]:vue[[composable 的单元测试](../guides/unit-testing-composables.md)：通过 `@data-client/vue/test` 中的 `renderDataCompose()`]

```ts
class Controller {
  /*************** Action Dispatchers ***************/
  fetch(endpoint, ...args): ReturnType<E>;
  fetchIfStale(endpoint, ...args): Promise<Denormalize<E['schema']>>;
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
  get(queryable, ...args, state): DenormalizeNullable<typeof queryable> | undefined;
  getResponse(endpoint, ...args, state): { data; expiryStatus; expiresAt };
  getError(endpoint, ...args, state): ErrorTypes | undefined;
  snapshot(state: State<unknown>, fetchedAt?: number): SnapshotInterface;
  getState(): State<unknown>;
}
```

## Action 派发方法 {#action-dispatchers}

### fetch(endpoint, ...args) {#fetch}

使用给定的 args 获取该 endpoint。获取完成后，响应或错误会写入缓存。

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
使用 schema 时，它返回反规范化后的值。

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

[sideEffect](/rest/api/Endpoint#sideeffect) 会改变 `fetch()` 的行为：

##### true {#true}

- 在缓存更新被[提交](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom)*之前* resolve。
- 每次调用都会发起新的获取。
- 不 await 时，它会产生未处理的 reject，因为没有组件读取它的错误。请 await 它，或使用
  [useLoading()](./useLoading.md) 显示错误。

##### false | undefined {#false--undefined}

- 在缓存更新被[提交](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom)*之后* resolve。
- 相同的请求会被去重，因此同一时间只有一个在进行中。
  - 若要发起一个*新的*请求，请先中止进行中的那个。
- 不 await 也安全：错误会存储起来，供读取该 endpoint 的组件使用，因此永远不会到达全局的
  未处理 rejection 处理函数（请改为[上报它](../concepts/managers.md#error-reporting)）。`await` 仍然会 reject。

### fetchIfStale(endpoint, ...args) {#fetchIfStale}

仅当数据缺失、[过时](../concepts/expiry-policy.md#stale)或[无效](../concepts/expiry-policy.md#invalid)时才获取，
并且总是返回一个代表最近一次获取结果的 Promise。这样在预取时可以避免重复获取仍然新鲜的数据。

| 缓存 | 是否获取 | `await` 得到 | 不 await |
| --- | --- | --- | --- |
| 缺失、过时或无效 | 是，与 [fetch()](#fetch) 相同 | 获取到的数据，或以其错误 reject | 错误会被存储；没有未处理的 rejection |
| 新鲜 | 否 | 缓存的数据 | 什么也不会发生 |
| 最近一次获取在 [errorExpiryLength](/rest/api/Endpoint#errorexpirylength) 内失败 | 否 | 以该错误 reject，就像 [useSuspense()](./useSuspense.md) 抛出它一样 | 什么也不会发生 |

因此预取无需 await，也无需捕获错误：读取该 endpoint 的组件会照常显示已存储的错误。
未 await 的失败不会到达全局的未处理 rejection 处理函数，所以请用
[错误上报 Manager](../concepts/managers.md#error-reporting) 上报获取错误。在结果上链式调用 `.then()` 会生成一个新的
Promise，所以请以 `.catch()` 结束这条链。

```ts
// start a secondary request without waiting for it
controller.fetchIfStale(CommentResource.getList, { issueId });
// wait for the data; rejects if that fetch fails
const issue = await controller.fetchIfStale(IssueResource.get, { id: issueId });
```

若想在不获取的情况下检查数据是否已缓存且新鲜，请同步读取 [getResponse()](#getResponse)。

:::react

#### 在路由 loader 中 {#fetchIfStale-loaders}

loader 会在下一个页面渲染之前开始它的获取。与 [useSuspense()](./useSuspense.md) 一样，导航只应在缓存数据无法渲染时等待：
数据缺失、已失效，或者来自
[invalidIfStale](../concepts/expiry-policy.md#endpointinvalidifstale) endpoint 且已过时。过时数据会立即渲染并
重新获取。具体做法取决于路由器在等待什么：

| 路由器 | 在 loader 中 | 没有缓存 |
| --- | --- | --- |
| 在 [transition](https://react.dev/reference/react/startTransition) 中切换路由，如 Next.js App Router、React Router 7、TanStack Router 或 [@anansi/router](https://www.npmjs.com/package/@anansi/router) | 启动每个 `fetchIfStale()` 但不 await，让路由器无需等待任何东西 | 当前页面会保留，直到新页面准备就绪；除非新页面有自己的 Suspense 边界（如 [AsyncBoundary](./AsyncBoundary.md) 或 TanStack Router 的 `pendingComponent`），此时会显示它的 fallback。@anansi/router 在后退和前进时会跳过 transition |
| 渲染 loader 的返回值，或者不在 transition 中切换路由（未开启 `v7_startTransition` 标志的 React Router 6） | 缓存数据能渲染时返回它；否则返回 `fetchIfStale()` | 路由器会等待获取完成 |

Next.js App Router 没有 loader：`useSuspense()` 会在页面渲染时获取数据。

```ts title="Router with transitions"
import type { Controller } from '@data-client/react';
import { CommentResource } from './resources/Comment';
import { IssueResource } from './resources/Issue';

export const issueLoader =
  (ctrl: Controller) =>
  ({ params }: { params: { id: string } }) => {
    // not awaited: the route changes at once, and useSuspense() waits inside the transition
    ctrl.fetchIfStale(IssueResource.get, { id: params.id });
    ctrl.fetchIfStale(CommentResource.getList, { issueId: params.id });
    // React Router 6 requires a return value
    return null;
  };
```

当服务端渲染会等待 loader 时（例如 @anansi/core 的 `prefetchSpout` 会等待 @anansi/router 的 `resolveData`），
还要 await 首屏视图的获取，让首个 HTML 包含它的数据。加上 `.catch(() => {})`（多个时使用
`Promise.allSettled()`），这样失败在客户端永远不会产生未处理的 reject；`useSuspense()` 仍会显示该
错误。

```ts
resolveData: async (controller: Controller, { id }: { id: string }) => {
  controller.fetchIfStale(CommentResource.getList, { issueId: id });
  await controller.fetchIfStale(IssueResource.get, { id }).catch(() => {});
},
```

```ts title="Router that renders loader data"
import { ExpiryStatus, type Controller } from '@data-client/react';
import { IssueResource } from './resources/Issue';

export const issueLoader =
  (ctrl: Controller) =>
  ({ params }: { params: { id: string } }) => {
    const args = { id: params.id };
    const { data, expiryStatus } = ctrl.getResponse(
      IssueResource.get,
      args,
      ctrl.getState(),
    );
    const fetched = ctrl.fetchIfStale(IssueResource.get, args);
    // stale data is still Valid, so it returns at once
    return expiryStatus === ExpiryStatus.Valid ? data : fetched;
  };
```

返回进行中获取的 loader 可以让路由器显示它自己的等待和错误 UI，但在请求进行期间会阻塞导航。
只要等待 loader 数据就会有这个取舍，不论由谁来获取。

<StackBlitz app="github-app" file="src/routing/routes.tsx" view="editor" />

:::

### expireAll(\{ testKey }) {#expireAll}

将所有匹配 `testKey` 的响应的[过期状态](../concepts/expiry-policy.md)设为 [Stale](../concepts/expiry-policy.md#stale)。

当缓存中有很多组 args 时，可以用它只刷新屏幕上的数据。

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

通常更好的做法是[把变更的副作用包含在变更响应中](/rest/guides/side-effects)。这样可以
降低负载、提升性能，并保持状态一致。

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

::::vue

:::tip[再次显示 Suspense fallback]

在失效之后，用新的 `key` 重新挂载组件；新的实例会因无效数据而挂起。
`timeout="0"` 让 `<Suspense>` 在等待时显示 fallback，而不是旧内容。重新挂载
会重置组件的本地状态。

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

如果想在刷新的同时继续显示过时数据，请使用 [Controller.fetch](#fetch)。

:::

::::

:::tip[一次使多个 endpoint 失效]

使用 [schema.Invalidate](/rest/api/Invalidate) 可以使所有包含某个 Entity 的 endpoint 失效。

对于 REST，可以试试 [Resource.delete](/rest/api/resource#delete)。

```ts
// deletes MyResource(5)
// this will refetch MyResource.get({id: '5'})
// and remove it from MyResource.getList
controller.setResponse(MyResource.delete, { id: '5' }, { id: '5' });
```

:::

### invalidateAll(\{ testKey }) {#invalidateAll}

使所有匹配 `testKey` 的 [endpoint key](/rest/api/RestEndpoint#key) [失效](../concepts/expiry-policy.md#invalid)。

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

下面的代码只让 test.com 域名上的 GET endpoint 失效。其他域名的数据仍保留在缓存中。

```ts
const myDomain = 'http://test.com';
const testKey = (key: string) => key.startsWith(`GET ${myDomain}`);

function useLogout() {
  const ctrl = useController();
  return () => ctrl.invalidateAll({ testKey });
}
```

遇到 401（未授权）时，也请使用 [LogoutManager](./LogoutManager.md) 清除缓存。

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

清除整个 Reactive Data Client 缓存。进行中的获取的响应不会被存储。这些获取会以 `ResetError`（`error.name === 'ResetError'`）reject，但 `sideEffect` 获取除外，它们仍会以自身的结果或错误结束。

在用户登出或已认证用户切换时使用它。

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

[Collection.push](/rest/api/Collection#push) 和 [unshift](/rest/api/Collection#unshift) 接收该 Collection 的参数（用于选出要添加到的列表），
以及一行或一组行。

```ts
ctrl.set(TodoResource.getList.schema.push, { userId: '1' }, [
  { id: '6', title: 'Buy milk' },
  { id: '7', title: 'Walk dog' },
]);
```

:::note Unions

当每个成员都把其判别字段声明为字面量（例如 `readonly type = 'first'`）时，
[Union](/rest/api/Union) 的每一行都会按其选中的成员进行检查，因此 `{ type: 'first', secondField: 1 }` 会
报错。只接受已声明的字段，因此被
`schemaAttribute` 函数读取的键必须在每个成员上声明。

:::

传入一个函数，根据已存储的值推导出新值。这样可以[避免竞态条件](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state)。

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

正在为这个 [Endpoint](/rest/api/Endpoint) 和 args 挂起的组件会 resolve。该 Endpoint 和 args 已有的数据会被更新；entity 会与其已存储的字段合并。

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

这是在 :react[React]:vue[Vue] 中的概念验证。[基于 Manager 的 websocket 实现](../concepts/managers.md#data-stream)
更加健壮。

### setError(endpoint, ...args, error) {#setError}

将 `error` 存储为该 [Endpoint](/rest/api/Endpoint) 和 args 的结果。

### resolve(endpoint, \{ args, response, fetchedAt, error }) {#resolve}

resolve 某次特定的获取，并把 `response` 存入缓存。

与 [setResponse](#setResponse) 类似，但 `fetchedAt` 会把响应绑定到某一次获取，从而移除那次获取的
乐观更新。

[NetworkManager](./NetworkManager.md) 会使用它。在 Manager 处理获取请求时使用它。

把获取 action 的 `action.meta.fetchedAt` 作为 `fetchedAt` 传入。这样 store 会丢弃在
[resetEntireStore()](#resetEntireStore) 之前发起的获取的响应，旧的响应也不会让同一个键上更新的获取完成。

### subscribe(endpoint, ...args) {#subscribe}

为该 [Endpoint](/rest/api/Endpoint) 和 args 添加一个订阅。每次调用都会让它的订阅者计数加一。

[useSubscription](./useSubscription.md) 和 [useLive](./useLive.md) 会在挂载时调用它。

自定义 :react[hook]:vue[composable] 可以调用它，根据其他条件进行订阅。

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

移除该 [Endpoint](/rest/api/Endpoint) 和 args 的一个订阅。每次调用都会让它的订阅者计数减一；
计数为 0 时，自动更新停止。

[useSubscription](./useSubscription.md) 和 [useLive](./useLive.md) 会在卸载时调用它。

## 数据访问 {#data-access}

### get(schema, ...args, state) {#get}

在 `state` 中查找任意 [Queryable](/rest/api/schema#queryable) [Schema](/rest/api/schema#schema-overview)。

#### Example {#example}

[useQuery](./useQuery.md) 基于它构建，[Manager](./Manager.md) 也可以用它安全地读取 store。

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

在组件中，[useQuery()](./useQuery.md) 会让结果保持响应式。事件处理函数读取它的当前值：

```ts
const props = defineProps<{ id: string }>();
const ctrl = useController();
const todo = useQuery(Todo, () => ({ id: props.id }));

const toggle = () => {
  if (!todo.value) return;
  ctrl.set(
    Todo,
    { id: props.id },
    { id: props.id, completed: !todo.value.completed },
  );
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

从给定的 `state` 中获取某个 endpoint 和 args 的响应。

#### data {#data}

反规范化后的响应。只要数据未变化，每个成员都保持同一个引用。

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

- 总是会挂起:vue[（仅在 setup 期间；已挂载的组件会[保留当前数据](../concepts/expiry-policy.md#invalidate)，直到重新获取完成）]
- 总是会获取

#### expiresAt {#expiresat}

数据过期的时间戳。可与 `Date.now()` 比较。

#### Example {#example-1}

[useCache](./useCache.md) 和 [useSuspense](./useSuspense.md) 基于它构建。[Manager](./Manager.md) 可以用它在给定的 state 中
查找响应。

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

在组件中，[useCache()](./useCache.md) 和 [useSuspense()](./useSuspense.md) 会让结果保持响应式。事件处理函数
读取它们的当前值。

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

获取某个 endpoint 和 args 的错误，没有错误时返回 `undefined`。

### snapshot(state, fetchedAt) {#snapshot}

返回一个 [Snapshot](./Snapshot.md)。

### getState() {#getState}

获取 Reactive Data Client 中*已经*[提交](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom)的内部状态。

::::warning

只在组件之外使用它：在 [Manager](./Manager.md) 中，或在路由 loader 之类的代码中。

:::react

在渲染期间调用 getState() 可能导致数据撕裂（tearing）。

:::

:::vue

在 `computed()` 或模板中使用 getState()，store 变化时不会更新。在这些地方请改用
[useQuery()](./useQuery.md) 或 [useCache()](./useCache.md)。

:::

::::

要根据变更的结果做后续操作，请使用 `fetch()` resolve 的值，而不是 `getState()`。
[变更](#endpointsideeffect)会在 store 更新*之前* resolve，所以 `getState()` 中还没有它的响应。
resolve 的值是反规范化后的响应。

:::react

```tsx
import { useController } from '@data-client/react';
import { useNavigate } from 'react-router';
import { PostResource } from './PostResource';

function UpdatePost({ id }: { id: string }) {
  const ctrl = useController();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const post = await ctrl.fetch(
      PostResource.update,
      { id },
      new FormData(e.currentTarget),
    );
    navigate(`/posts/${post.id}`);
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

:::

:::vue

```html title="UpdatePost.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { useRouter } from 'vue-router';
  import { PostResource } from './PostResource';

  const props = defineProps<{ id: string }>();
  const ctrl = useController();
  const router = useRouter();

  const handleSubmit = async (e: Event) => {
    const post = await ctrl.fetch(
      PostResource.update,
      { id: props.id },
      new FormData(e.target as HTMLFormElement),
    );
    router.push(`/posts/${post.id}`);
  };
</script>

<template>
  <form @submit.prevent="handleSubmit"><!-- ... --></form>
</template>
```

:::
