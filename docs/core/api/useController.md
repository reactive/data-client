---
title: useController() - Type safe store manipulation in React
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

## Examples

### Form submission

[fetch](./Controller.md#fetch) returns the denormalized response, matching [useSuspense()](./useSuspense.md)'s return type. This allows using Entity methods like `pk()`.

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

### Direct entity update

Use [set](./Controller.md#set) for immediate updates without network requests. Supports functional updates to avoid race conditions.

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

### Invalidate after mutation

Force refetch of related data using [invalidate](./Controller.md#invalidate) or [expireAll](./Controller.md#expireAll).

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

:::tip

For better performance and consistency, prefer [including side effect updates in mutation responses](/rest/guides/side-effects).

:::

### Prefetching

Use [fetchIfStale](./Controller.md#fetchIfStale) to prefetch without overfetching fresh data.

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

### Websocket updates

Populate cache with external data via [set](./Controller.md#set).

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

:::warning

For production use, implement a [Manager for data streams](../concepts/managers.md#data-stream) rather than component-level effects. Managers handle connection lifecycle globally and work with SSR.

:::

### Todo App

<StackBlitz app="todo-app" file="src/resources/TodoResource.ts,src/pages/Home/TodoListItem.tsx" view="both" />
