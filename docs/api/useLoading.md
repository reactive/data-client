---
title: useLoading()
---

```typescript
export default function useLoading<F extends (...args: any) => Promise<any>>(
  func: F,
  onError?: (error: Error) => void,
): [F, boolean];
```

Tracking promise resolution of a function.

```tsx
import { useLoading } from '@rest-hooks/hooks';

function Button({ onClick, children, ...props }) {
  const [clickHandler, loading] = useLoading(onClick);
  return (
    <button onClick={clickHandler} {...props}>
      {loading ? 'Loading...' : children}
    </button>
  );
}
```

### Todo toggle example

```tsx
import { useCallback } from 'react';
import { useFetcher } from 'rest-hooks';
import { useLoading } from '@rest-hooks/hooks';

import TodoResource from 'resources/TodoResource';

interface Props {
  todo: TodoResource;
}

function TodoListItem({ todo }) {
  const partialUpdate = useFetcher(TodoResource.partialUpdate());

  const toggle = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      partialUpdate({ id }, { completed: e.currentTarget.checked }),
    [partialUpdate],
  );

  const [toggleHandler, loading] = useLoading(toggle);

  return (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={toggleHandler}
      />
      {loading ? <Spinner /> : null}
      {todo.title}
    </div>
  );
}
```
