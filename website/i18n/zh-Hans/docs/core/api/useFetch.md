---
title: useFetch() - React 中的声明式获取触发器
vue_title: useFetch() - Vue 中的声明式获取触发器
sidebar_label: useFetch()
description: 配合 React.use() 获取并读取 endpoint 数据。获取时挂起，返回反规范化数据，失效时重新挂起。
vue_description: 当 Endpoint 不在缓存中或已过时时获取它。返回指向获取 promise 的 Ref，失效时重新获取。
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import StackBlitz from '@site/src/components/StackBlitz';
import { parallelFetchFixtures } from '@site/src/fixtures/post-comments';
import VueArgs from '../shared/\_vueArgs.mdx';

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

# useFetch()

:::react

当 Endpoint 不在缓存中或已过时时获取它。返回一个可与
[React.use()](https://react.dev/reference/react/use) 配合使用的 thenable——`use(useFetch(endpoint, args))` 的行为
与 [useSuspense()](./useSuspense.md) 相同：数据加载时挂起，数据可用时
返回反规范化数据，并在[失效](./Controller.md#invalidate)时重新挂起。

:::

:::vue

当 Endpoint 不在缓存中或已过时时获取它。返回一个持有获取 promise（带有 `resolved` 标志）的
[Ref](https://vuejs.org/api/reactivity-core.html#ref)。当参数变化或
数据[失效](./Controller.md#invalidate)时，会触发新的获取。用它来提前发起获取，然后再用
[useSuspense()](./useSuspense.md)、[useCache()](./useCache.md) 或 [useDLE()](./useDLE.md) 读取数据。

:::

## 用法 {#usage}

### 并行加载数据 {#parallel-data-loading}

:::react

由于 `useFetch()` 和 `use()` 是分开调用的，多个获取会并行开始——即使第一个 `use()` 挂起也是如此。请参阅下方的[并行获取示例](#parallel-data-loading)。

:::

:::vue

在 `<script setup>` 中，`await useSuspense()` 是顺序执行的。先为每个 endpoint 调用 `useFetch()`，
就能并行发起所有获取；随后的 `useSuspense()` 调用会复用这些进行中的请求。

:::

<FrameworkPlayground fixtures={parallelFetchFixtures} row>

```ts title="Resources" collapsed
import { Entity, resource } from '@data-client/rest';

export class Post extends Entity {
  id = 0;
  title = '';
  body = '';
  static key = 'Post';
}
export const PostResource = resource({
  path: '/posts/:id',
  schema: Post,
});

export class Comment extends Entity {
  id = 0;
  postId = 0;
  author = '';
  text = '';
  static key = 'Comment';
}
export const CommentResource = resource({
  path: '/comments/:id',
  searchParams: {} as { postId: number },
  schema: Comment,
});
```

:::react

```tsx title="PostWithComments" {7-13}
import { use } from 'react';
import { useFetch } from '@data-client/react';
import { PostResource, CommentResource } from './Resources';

function PostWithComments({ id }: { id: number }) {
  // Both fetches start in parallel
  const postPromise = useFetch(PostResource.get, { id });
  const commentsPromise = useFetch(CommentResource.getList, {
    postId: id,
  });

  // use() reads the results — if the first suspends,
  // the second fetch is already in-flight
  const post = use(postPromise);
  const comments = use(commentsPromise);

  return (
    <article>
      <h3>{post.title}</h3>
      <p>{post.body}</p>
      <h4>Comments</h4>
      {comments.map(comment => (
        <div key={comment.id} className="listItem">
          <strong>{comment.author}</strong>: {comment.text}
        </div>
      ))}
    </article>
  );
}
render(<PostWithComments id={1} />);
```

:::

:::vue

```html title="PostWithComments.vue" {7-15}
<script setup lang="ts">
  import { useFetch, useSuspense } from '@data-client/vue';
  import { PostResource, CommentResource } from './Resources';

  const props = defineProps<{ id: number }>();

  // Both fetches start in parallel
  useFetch(PostResource.get, () => ({ id: props.id }));
  useFetch(CommentResource.getList, () => ({ postId: props.id }));

  // useSuspense() reads the results — the second fetch
  // is already in-flight while the first one is awaited
  const post = await useSuspense(PostResource.get, () => ({ id: props.id }));
  const comments = await useSuspense(CommentResource.getList, () => ({
    postId: props.id,
  }));
</script>

<template>
  <article>
    <h3>{{ post.title }}</h3>
    <p>{{ post.body }}</p>
    <h4>Comments</h4>
    <div v-for="comment in comments" :key="comment.id" class="listItem">
      <strong>{{ comment.author }}</strong>: {{ comment.text }}
    </div>
  </article>
</template>
```

:::

</FrameworkPlayground>

### 预取 {#prefetching}

`useFetch()` 也可以单独使用，在渲染树的较早位置确保资源在需要之前就已可用。

:::tip

在另一个组件中与数据绑定 hook（[useCache()](./useCache.md)、[useSuspense()](./useSuspense.md)、[useDLE()](./useDLE.md)、[useLive()](./useLive.md)）
结合使用。

:::

:::react

```tsx
import { useFetch } from '@data-client/react';
import { PostResource } from './resources/Post';

function MasterPost({ id }: { id: number }) {
  useFetch(PostResource.get, { id });
  // ...
}
```

:::

:::vue

```html title="MasterPost.vue"
<script setup lang="ts">
  import { useFetch } from '@data-client/vue';
  import { PostResource } from './Resources';

  const props = defineProps<{ id: number }>();
  useFetch(PostResource.get, () => ({ id: props.id }));
  // ...
</script>
```

:::

## 行为 {#behavior}

:::react

| 过期状态 | 获取           | `use()` 行为 | `resolved` | 条件                                                                                                                             |
| ------------- | --------------- | ---------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Invalid       | 是<sup>1</sup> | 挂起         | `false`    | 不在 store 中、[删除](/rest/api/resource#delete)、[失效](./Controller.md#invalidate)                                        |
| Stale         | 是<sup>1</sup> | 挂起         | `false`    | （首次渲染、参数变化）且 [过期时间 &lt; 当前时间](../concepts/expiry-policy.md)                                                           |
| Valid         | 否              | 返回数据     | `true`     | 获取完成                                                                                                                       |
| Error         | 否              | 抛出错误     | `true`     | 获取失败，由 [Error Boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) 捕获 |
|               | 否              | `undefined`      |            | 第二个参数为 `null`                                                                                                         |

当 store 更新时（例如通过变更或 [Controller.set()](./Controller.md#set)），组件
会重新渲染，`useFetch()` 会自动返回更新后的反规范化数据。

:::

:::vue

| 过期状态 | 获取           | `.value`         | `resolved` | 条件                                                                                      |
| ------------- | --------------- | ---------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| Invalid       | 是<sup>1</sup> | pending 状态的 promise  | `false`    | 不在 store 中、[删除](/rest/api/resource#delete)、[失效](./Controller.md#invalidate) |
| Stale         | 是<sup>1</sup> | pending 状态的 promise  | `false`    | （首次渲染、参数变化）且 [过期时间 &lt; 当前时间](../concepts/expiry-policy.md)                    |
| Valid         | 否              | 已 resolve 的 promise | `true`     | 获取完成                                                                                |
| Error         | 否              | 已 reject 的 promise | `true`     | 获取失败                                                                                    |
|               | 否              | `undefined`      |            | 第二个参数为 `null`                                                                  |

每当触发获取时，返回的 `Ref` 都会更新为新的 promise：包括参数变化、
[失效](./Controller.md#invalidate)或[重置](./Controller.md#resetEntireStore)时。

:::

:::note

1. 相同的获取会自动去重

:::

::::react

:::info[React Native]

使用 React Navigation 时，如果数据被视为过时，useFetch() 会在获得焦点时
触发获取。

:::

::::

<ConditionalDependencies hook="useFetch" />

## 类型 {#types}

:::react

<GenericsTabs>

```typescript
function useFetch(
  endpoint: ReadEndpoint,
  ...args: Parameters<typeof endpoint> | [null]
): (PromiseLike<any> & { resolved: boolean }) | undefined;
```

```typescript
function useFetch<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined
  >,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(endpoint: E, ...args: Args): UsablePromise<Denormalize<E['schema']>>;
```

</GenericsTabs>

:::

:::vue

```typescript
function useFetch(
  endpoint: ReadEndpoint,
  ...args: MaybeRefsOrGetters<Parameters<typeof endpoint>> | [null]
): Readonly<
  Ref<
    | (Promise<Denormalize<typeof endpoint.schema>> & {
        resolved: boolean;
      })
    | undefined
  >
>;
```

<VueArgs />

参数变化时会触发新的获取。

:::

## 示例 {#examples}

### 检查获取状态 {#checking-fetch-status}

使用 `promise.resolved` 检查数据是否仍在加载：

:::react

```tsx
import { useFetch } from '@data-client/react';
import { PostResource } from './resources/Post';

function MasterPost({ id }: { id: number }) {
  const promise = useFetch(PostResource.get, { id });
  if (!promise.resolved) {
    // fetch is in-flight
  }
  // ...
}
```

:::

:::vue

```html title="MasterPost.vue"
<script setup lang="ts">
  import { useFetch } from '@data-client/vue';
  import { PostResource } from './Resources';

  const props = defineProps<{ id: number }>();
  const promise = useFetch(PostResource.get, () => ({ id: props.id }));
  if (promise.value && !promise.value.resolved) {
    // fetch is in-flight
  }
  // ...
</script>
```

:::

:::react

### NextJS 预加载 {#nextjs-preload}

为了避免 NextJS 中的获取瀑布，有时你可能需要为顶层路由添加[预加载](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns#preloading-data)。

<StackBlitz repo="coin-app" file="src/app/[id]/page.tsx" initialpath="/BTC" view="editor" height="700" />

:::
