---
title: useLoading()
---

<head>
  <title>useLoading() - Turn any promise into React State</title>
</head>

```typescript
export default function useLoading<F extends (...args: any) => Promise<any>>(
  func: F,
  deps: readonly any[] = [],
): [F, boolean];
```

Helps track loading state of imperative async functions.

```tsx
import { useLoading } from '@rest-hooks/hooks';

function Button({ onClick, children, ...props }) {
  const [clickHandler, loading, error] = useLoading(onClick);
  return (
    <button onClick={clickHandler} {...props}>
      {loading ? 'Loading...' : children}
    </button>
  );
}
```

Part of [@rest-hooks/hooks](https://www.npmjs.com/package/@rest-hooks/hooks)

:::tip

[useSuspense()](./useSuspense.md) or [useDLE()](./useDLE.md) are better for GET/read endpoints.

:::

### Todo toggle example

```tsx
import { useCallback } from 'react';
import { useController } from 'rest-hooks';
import { useLoading } from '@rest-hooks/hooks';

import { TodoResource, Todo } from 'api/Todo';

interface Props {
  todo: Todo;
}

function TodoListItem({ todo }) {
  const { fetch } = useController();

  const [toggleHandler, loading, error] = useLoading(
    (e: ChangeEvent<HTMLInputElement>) =>
      fetch(
        TodoResource.partialUpdate,
        { id },
        { completed: e.currentTarget.checked },
      ),
    [fetch],
  );

  return (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={toggleHandler}
      />
      {loading ? <Spinner /> : null}
      {error ? <Error>{error}</Error> : null}
      {todo.title}
    </div>
  );
}
```

:::tip Eslint configuration

Since we use the deps list, be sure to add useLoading to the 'additionalHooks' configuration
of [react-hooks/exhaustive-deps](https://www.npmjs.com/package/eslint-plugin-react-hooks) rule if you use it.

```js
{
  "rules": {
    // ...
    "react-hooks/exhaustive-deps": ["warn", {
      "additionalHooks": "(useLoading)"
    }]
  }
}
```

:::
