---
title: useCancelling()
---

import HooksPlayground from '@site/src/components/HooksPlayground';

<head>
  <title>useCancelling() - Declarative fetch aborting for React</title>
</head>

```typescript
function useCancelling<
  E extends EndpointInterface & {
    extend: (o: { signal?: AbortSignal }) => any;
  },
>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]): E {
```

Builds an Endpoint that cancels fetch everytime params change

[Aborts](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) inflight request if the parameters change.

<HooksPlayground>

```tsx title="api/Todo.ts" collapsed
export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
  pk() {
    return `${this.id}`;
  }
}
export const TodoResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
});
```

```tsx title="TodoDetail.tsx" {6}
import { useSuspense } from '@rest-hooks/react';
import { useCancelling } from '@rest-hooks/hooks';
import { TodoResource } from './api/Todo';

export default function TodoDetail({ id }: { id: number }) {
  const todo = useSuspense(useCancelling(TodoResource.get, { id }), { id });
  return <div>{todo.title}</div>;
}
```

```tsx title="Demo" collapsed
import React from 'react';
import TodoDetail from './TodoDetail';

function AbortDemo() {
  const [id, setId] = React.useState(1);
  return (
    <div>
      <React.Suspense fallback="...">
        <TodoDetail id={id} />
      </React.Suspense>
      <div>
        <button onClick={() => setId(id => id - 1)}>⬇️</button>{' '}
        <button onClick={() => setId(id => id + 1)}>⬆️</button> &nbsp;{id}
      </div>
    </div>
  );
}
render(<AbortDemo />);
```

</HooksPlayground>

Try clicking the `+` very quickly. If you increment before it resolves the request will be cancelled and you should
not see results in the store.

:::caution Warning

Be careful when using this with many disjoint components fetching the same
arguments (Endpoint/params pair) to useSuspense(). This solution aborts fetches per-component,
which means you might end up canceling a fetch that another component still cares about.

:::

Part of [@rest-hooks/hooks](https://www.npmjs.com/package/@rest-hooks/hooks)
