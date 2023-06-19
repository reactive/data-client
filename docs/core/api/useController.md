---
title: useController()
---

<head>
  <title>useController() - Type safe store manipulation in React</title>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import TypeScriptEditor from '@site/src/components/TypeScriptEditor';

[Controller](./Controller.md) provides type-safe methods to manipulate the store.

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

### /next

`@rest-hooks/react/next` contains the version of `useController()` that will ship with the next version.
This provides a return value that matches [useSuspense()](./useSuspense.md) - utilizing the [Endpoint.schema](/rest/api/RestEndpoint#schema)

```ts
import { useController } from '@data-client/react/next';

const post = await controller.fetch(PostResource.create, createPayload);
post.title;
post.pk();
```

### Todo App

<iframe
  loading="lazy"
  src="https://stackblitz.com/github/data-client/rest-hooks/tree/master/examples/todo-app?embed=1&file=src%2Fresources%2FTodoResource.ts,src%2Fpages%2FHome%2FTodoListItem.tsx&hidedevtools=1&view=both&terminalHeight=0&hideNavigation=1"
  width="100%"
  height="500"
></iframe>

Explore more [Reactive Data Client demos](/demos)

