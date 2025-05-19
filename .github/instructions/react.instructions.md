---
applyTo: '**/*.tsx'
---
## Rendering

```ts
// GET https://jsonplaceholder.typicode.com/todos/5
const todo = useSuspense(TodoResource.get, { id: 5 });
// GET https://jsonplaceholder.typicode.com/todos
const todoList = useSuspense(TodoResource.getList);
// GET https://jsonplaceholder.typicode.com/todos?userId=1
const todoListByUser = useSuspense(TodoResource.getList, { userId: 1 });
// subscriptions
const todo = useLive(TodoResource.get, { id: 5 });
// without fetch
const todo = useCache(TodoResource.get, { id: 5 });
const todo = useQuery(Todo, { id: 5 });
```

## Mutations

```ts
const ctrl = useController();
// PUT https://jsonplaceholder.typicode.com/todos/5
const updateTodo = todo => ctrl.fetch(TodoResource.update, { id }, todo);
// PATCH https://jsonplaceholder.typicode.com/todos/5
const partialUpdateTodo = todo =>
  ctrl.fetch(TodoResource.partialUpdate, { id }, todo);
// POST https://jsonplaceholder.typicode.com/todos
const addTodoToBeginning = todo =>
  ctrl.fetch(TodoResource.getList.unshift, todo);
// POST https://jsonplaceholder.typicode.com/todos?userId=1
const addTodoToEnd = todo => ctrl.fetch(TodoResource.getList.push, { userId: 1 }, todo);
// DELETE https://jsonplaceholder.typicode.com/todos/5
const deleteTodo = id => ctrl.fetch(TodoResource.delete, { id });
// GET https://jsonplaceholder.typicode.com/todos?userId=1&page=2
const getNextPage = (page) => ctrl.fetch(TodoResource.getList.getPage, { userId: 1, page })
```

## Helpful hooks

```tsx
const [handleSubmit, loading, error] = useLoading(
  async data => {
    const post = await ctrl.fetch(PostResource.getList.push, data);
    navigateToPost(post.id);
  },
  [ctrl],
);
```

```tsx
const [query, setQuery] = React.useState('');
const handleChange = e => setQuery(e.currentTarget.value);
const [debouncedQuery, isPending] = useDebounce(query, 200);

return (
  <AsyncBoundary fallback={<Loading />}>
    <IssueList query={debouncedQuery} owner="facebook" repo="react" />
  </AsyncBoundary>
)
```

## Components

Prefer using `AsyncBoundary` for error handling and loading states. Its props are `fallback`, `errorComponent`, and `errorClassName` and `listen`. It can be used to wrap any component that fetches data.

```tsx
<AsyncBoundary listen={history.listen}>
  <TodoList />
</AsyncBoundary>
```

## Type-safe imperative actions

`Controller` is returned from `useController()`. It has: ctrl.fetch(), ctrl.fetchIfStale(), ctrl.expireAll(), ctrl.invalidate(), ctrl.invalidateAll(), ctrl.setResponse(), ctrl.set().

## Programmatic queries

```ts
const queryRemainingTodos = new schema.Query(
  TodoResource.getList.schema,
  entries => entries.filter(todo => !todo.completed).length,
);

const allRemainingTodos = useQuery(queryRemainingTodos);
const firstUserRemainingTodos = useQuery(queryRemainingTodos, { userId: 1 });
```

```ts
const groupTodoByUser = new schema.Query(
  TodoResource.getList.schema,
  todos => Object.groupBy(todos, todo => todo.userId),
);
const todosByUser = useQuery(groupTodoByUser);
```

---

## Managers

Customer managers allow for global side effect handling. They interface with the store using `Controller`, and middleware is run in response to actions.

```ts
import type { Manager, Middleware, EntityInterface } from '@data-client/react';
import { actionTypes } from '@data-client/react';
import isEntity from './isEntity';

export default class CustomSubsManager implements Manager {
  protected declare entities: Record<string, EntityInterface>;

  middleware: Middleware = controller => next => async action => {
    switch (action.type) {
      case actionTypes.SUBSCRIBE:
      case actionTypes.UNSUBSCRIBE:
        const { schema } = action.endpoint;
        // only process registered entities
        if (schema && isEntity(schema) && schema.key in this.entities) {
          if (action.type === actionTypes.SUBSCRIBE) {
            this.subscribe(schema.key, action.args[0]?.product_id);
          } else {
            this.unsubscribe(schema.key, action.args[0]?.product_id);
          }

          // consume subscription if we use it
          return Promise.resolve();
        }
      default:
        return next(action);
    }
  };

  cleanup() {}

  subscribe(channel: string, product_id: string) {}
  unsubscribe(channel: string, product_id: string) {}
}
```

## Best Practices & Notes

- `useDebounce(query, timeout);` when rendering async data based on user field inputs
- `[handleSubmit, loading, error] = useLoading()` when tracking mutation loads like submitting an async form
- Prefer smaller React components that do one thing.

# Official Documentation Links

- [Rendering](https://dataclient.io/docs/getting-started/data-dependency)
- [Mutations](https://dataclient.io/docs/getting-started/mutations)
- [Managers](https://dataclient.io/docs/concepts/managers)
- [useSuspense](https://dataclient.io/docs/api/useSuspense)
- [Controller](https://dataclient.io/docs/api/Controller)

**ALWAYS follow these patterns and refer to the official docs for edge cases. Prioritize code generation that is idiomatic, type-safe, and leverages automatic normalization/caching via schema definitions.**