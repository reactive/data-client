---
title: useController() - 在 React 中类型安全地操作 store
vue_title: useController() - 在 Vue 中类型安全地操作 store
sidebar_label: useController()
description: Controller 提供类型安全的方法，用于访问 store 并向其分发 action。
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import StackBlitz from '@site/src/components/StackBlitz';

# useController()

[Controller](./Controller.md) 提供类型安全的方法，用于访问 store 并向其分发 action。

例如 [fetch](./Controller.md#fetch)、[invalidate](./Controller.md#invalidate)
和 [setResponse](./Controller.md#setResponse)

:::react

```tsx
import { useCallback } from 'react';
import { useController } from '@data-client/react';
import { MyResource } from './resources';

function MyComponent({ id }: { id: string }) {
  const ctrl = useController();

  const handleRefresh = useCallback(
    async e => {
      await ctrl.fetch(MyResource.get, { id });
    },
    [ctrl, id],
  );

  const handleSuspend = useCallback(
    async e => {
      await ctrl.invalidate(MyResource.get, { id });
    },
    [ctrl, id],
  );

  const handleLogout = useCallback(
    async e => {
      ctrl.resetEntireStore();
    },
    [ctrl],
  );
}
```

:::

:::vue

```html
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { MyResource } from './resources';

  const props = defineProps<{ id: string }>();
  const ctrl = useController();

  const handleRefresh = async () => {
    await ctrl.fetch(MyResource.get, { id: props.id });
  };

  const handleSuspend = async () => {
    await ctrl.invalidate(MyResource.get, { id: props.id });
  };

  const handleLogout = () => {
    ctrl.resetEntireStore();
  };
</script>
```

`useController()` 必须在 `<script setup>`（或 `setup()`）中调用，并且需要安装
[DataClientPlugin](./DataClientPlugin.md)。
在模板和选项式 API 中，同一个 [Controller](./Controller.md) 也可以通过 [`$dataClient`](./DataClientPlugin.md#dataclient) 访问。

:::

## 示例 {#examples}

### 表单提交 {#form-submission}

[fetch](./Controller.md#fetch) 返回反规范化后的响应，与 [useSuspense()](./useSuspense.md) 的返回类型一致。这样就可以使用 `pk()` 等 Entity 方法。

:::react

```tsx
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useController } from '@data-client/react';
import { PostResource } from './PostResource';

function CreatePost() {
  const ctrl = useController();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const post = await ctrl.fetch(
      PostResource.getList.push,
      new FormData(e.target as HTMLFormElement),
    );
    post.title;
    post.computedField;
    navigate(`/post/${post.pk()}`);
  };

  return <form onSubmit={handleSubmit}>{/* fields */}</form>;
}
```

:::

:::vue

```html title="CreatePost.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { useRouter } from 'vue-router';
  import { PostResource } from './PostResource';

  const ctrl = useController();
  const router = useRouter();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const post = await ctrl.fetch(
      PostResource.getList.push,
      new FormData(e.target as HTMLFormElement),
    );
    post.title;
    post.computedField;
    router.push(`/post/${post.pk()}`);
  };
</script>

<template>
  <form @submit="handleSubmit"><!-- fields --></form>
</template>
```

:::

### 直接更新 Entity {#direct-entity-update}

使用 [set](./Controller.md#set) 可以在不发起网络请求的情况下立即更新。它支持函数式更新，以避免竞态条件。

:::react

```tsx
import { useController } from '@data-client/react';
import { Article } from './Article';

function VoteButton({ articleId }: { articleId: string }) {
  const ctrl = useController();

  return (
    <button
      onClick={() =>
        ctrl.set(Article, { id: articleId }, article => ({
          ...article,
          votes: article.votes + 1,
        }))
      }
    >
      Vote
    </button>
  );
}
```

:::

:::vue

```html title="VoteButton.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { Article } from './Article';

  const props = defineProps<{ articleId: string }>();
  const ctrl = useController();

  const vote = () =>
    ctrl.set(Article, { id: props.articleId }, article => ({
      ...article,
      votes: article.votes + 1,
    }));
</script>

<template>
  <button @click="vote">Vote</button>
</template>
```

:::

### 变更后使数据失效 {#invalidate-after-mutation}

使用 [invalidate](./Controller.md#invalidate) 或 [expireAll](./Controller.md#expireAll) 强制重新获取相关数据。

:::react

```tsx
import { useController } from '@data-client/react';
import { UserResource } from './UserResource';

function ClearUserCache({ userId }: { userId: string }) {
  const ctrl = useController();

  const handleClear = async () => {
    // invalidate() causes suspense; expireAll() refetches silently
    ctrl.expireAll(UserResource.get);
    ctrl.expireAll(UserResource.getList);
  };

  return <button onClick={handleClear}>Refresh user data</button>;
}
```

:::

:::vue

```html title="ClearUserCache.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { UserResource } from './UserResource';

  const ctrl = useController();

  const handleClear = async () => {
    // invalidate() causes suspense; expireAll() refetches silently
    ctrl.expireAll(UserResource.get);
    ctrl.expireAll(UserResource.getList);
  };
</script>

<template>
  <button @click="handleClear">Refresh user data</button>
</template>
```

:::

:::tip

为了获得更好的性能和一致性，优先[在变更响应中包含副作用更新](/rest/guides/side-effects)。

:::

### 预取 {#prefetching}

使用 [fetchIfStale](./Controller.md#fetchIfStale) 进行预取，而不会重复获取仍然新鲜的数据。

:::react

```tsx
import { Link } from 'react-router';
import { useController } from '@data-client/react';
import { ArticleResource } from './ArticleResource';

function ArticleLink({ id }: { id: string }) {
  const ctrl = useController();

  return (
    <Link
      to={`/article/${id}`}
      onMouseEnter={() => ctrl.fetchIfStale(ArticleResource.get, { id })}
    >
      Read more
    </Link>
  );
}
```

:::

:::vue

```html title="ArticleLink.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { ArticleResource } from './ArticleResource';

  const props = defineProps<{ id: string }>();
  const ctrl = useController();

  const prefetch = () =>
    ctrl.fetchIfStale(ArticleResource.get, { id: props.id });
</script>

<template>
  <RouterLink :to="`/article/${id}`" @mouseenter="prefetch">
    Read more
  </RouterLink>
</template>
```

:::

### Websocket 更新 {#websocket-updates}

通过 [set](./Controller.md#set) 用外部数据填充缓存。

:::react

```tsx
import { useEffect } from 'react';
import { useController } from '@data-client/react';
import { EntityMap } from './resources';

function useWebsocket(url: string) {
  const ctrl = useController();

  useEffect(() => {
    const ws = new WebSocket(url);
    ws.onmessage = event => {
      const { entity, args, data } = JSON.parse(event.data);
      ctrl.set(EntityMap[entity], args, data);
    };
    return () => ws.close();
  }, [ctrl, url]);
}
```

:::

:::vue

```ts title="useWebsocket.ts"
import { onMounted, onUnmounted } from 'vue';
import { useController } from '@data-client/vue';
import { EntityMap } from './resources';

export function useWebsocket(url: string) {
  const ctrl = useController();
  let ws: WebSocket;

  onMounted(() => {
    ws = new WebSocket(url);
    ws.onmessage = event => {
      const { entity, args, data } = JSON.parse(event.data);
      ctrl.set(EntityMap[entity], args, data);
    };
  });
  onUnmounted(() => ws?.close());
}
```

:::

:::warning

在生产环境中，请实现一个[用于数据流的 Manager](../concepts/managers.md#data-stream)，而不是使用组件级的 :react[effect]:vue[生命周期钩子]。Manager 会在全局处理连接的生命周期，并且支持 SSR。

:::

### Todo 应用 {#todo-app}

:::react

<StackBlitz app="todo-app" file="src/resources/TodoResource.ts,src/pages/Home/TodoListItem.tsx" view="both" />

:::

:::vue

<StackBlitz app="vue-todo-app" file="src/resources/TodoResource.ts,src/components/TodoItem.vue" view="both" />

:::
