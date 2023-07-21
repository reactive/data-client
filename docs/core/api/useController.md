---
title: useController()
---

<head>
  <title>useController() - Type safe store manipulation in React</title>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import StackBlitz from '@site/src/components/StackBlitz';

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

### Using the resolution

`controller.fetch()` matches the return type [useSuspense()](./useSuspense.md) - utilizing the [Endpoint.schema](/rest/api/RestEndpoint#schema)
when possible. This allows us to use any class members.

```ts
import { useController } from '@data-client/react';

const post = await controller.fetch(PostResource.create, createPayload);
post.title;
post.computedField
post.pk();
```

### Todo App

<StackBlitz app="todo-app" file="src/resources/TodoResource.ts,src/pages/Home/TodoListItem.tsx" view="both" />

Explore more [Reactive Data Client demos](/demos)

