---
title: useController() - Type safe store manipulation in React
vue_title: useController() - Type safe store manipulation in Vue
sidebar_label: useController()
description: Controller provides type-safe methods to access and dispatch actions to the store.
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import StackBlitz from '@site/src/components/StackBlitz';

# useController()

[Controller](./Controller.md) provides type-safe methods to access and dispatch actions to the store.

For instance [fetch](./Controller.md#fetch), [invalidate](./Controller.md#invalidate),
and [setResponse](./Controller.md#setResponse)

:::react

```tsx
import { useController } from '@data-client/react';

function MyComponent({ id }) {
  const ctrl = useController();

  const handleRefresh = useCallback(
    async e => {
      await ctrl.fetch(MyResource.get, { id });
    },
    [fetch, id],
  );

  const handleSuspend = useCallback(
    async e => {
      await ctrl.invalidate(MyResource.get, { id });
    },
    [invalidate, id],
  );

  const handleLogout = useCallback(
    async e => {
      ctrl.resetEntireStore();
    },
    [resetEntireStore],
  );
}
```

:::

:::vue

```html
<script setup lang="ts">
  import { useController } from '@data-client/vue';

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

`useController()` must be called inside `<script setup>` (or `setup()`), and requires the
[DataClientPlugin](./DataClientPlugin.md) to be installed.
The same [Controller](./Controller.md) is also available in templates and the Options API as [`$dataClient`](./DataClientPlugin.md#dataclient).

:::

## Examples

### Form submission

[fetch](./Controller.md#fetch) returns the denormalized response, matching [useSuspense()](./useSuspense.md)'s return type. This allows using Entity methods like `pk()`.

:::react

```tsx
function CreatePost() {
  const ctrl = useController();

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

### Direct entity update

Use [set](./Controller.md#set) for immediate updates without network requests. Supports functional updates to avoid race conditions.

:::react

```tsx
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

### Invalidate after mutation

Force refetch of related data using [invalidate](./Controller.md#invalidate) or [expireAll](./Controller.md#expireAll).

:::react

```tsx
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

For better performance and consistency, prefer [including side effect updates in mutation responses](/rest/guides/side-effects).

:::

### Prefetching

Use [fetchIfStale](./Controller.md#fetchIfStale) to prefetch without overfetching fresh data.

:::react

```tsx
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

### Websocket updates

Populate cache with external data via [set](./Controller.md#set).

:::react

```tsx
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

For production use, implement a [Manager for data streams](../concepts/managers.md#data-stream) rather than component-level :react[effects]:vue[lifecycle hooks]. Managers handle connection lifecycle globally and work with SSR.

:::

### Todo App

:::react

<StackBlitz app="todo-app" file="src/resources/TodoResource.ts,src/pages/Home/TodoListItem.tsx" view="both" />

:::

:::vue

<StackBlitz app="vue-todo-app" file="src/resources/TodoResource.ts,src/components/TodoItem.vue" view="both" />

:::
