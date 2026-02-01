---
name: rdc-react
description: Use @data-client/react hooks - useSuspense, useQuery, useCache, useLive, useController for fetch/mutations, DataProvider, AsyncBoundary, useLoading, useDebounce
license: Apache 2.0
---
## Rendering

```ts
// GET https://jsonplaceholder.typicode.com/todos/5
const todo = useSuspense(TodoResource.get, { id: 5 });
// GET https://jsonplaceholder.typicode.com/todos
const todoList = useSuspense(TodoResource.getList);
// GET https://jsonplaceholder.typicode.com/todos?userId=1
const todoListByUser = useSuspense(TodoResource.getList, { userId: 1 });
// subscriptions with polling, websockets or SSE
const todo = useLive(TodoResource.get, { id: 5 });
// without fetch
const todo = useCache(TodoResource.get, { id: 5 });
const todo = useQuery(Todo, { id: 5 });
```

For API definitions (like TodoResource), apply the skill "rdc-rest".

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

Prefer using [AsyncBoundary](https://dataclient.io/docs/api/AsyncBoundary) for error handling and loading states.
Its props are `fallback`, `errorComponent`, and `errorClassName` and `listen`. It can be used to wrap any component that fetches data.

```tsx
<AsyncBoundary listen={history.listen}>
  <TodoList />
</AsyncBoundary>
```

## Type-safe imperative actions

[Controller](https://dataclient.io/docs/api/Controller) is returned from `useController()`. It has:
ctrl.fetch(), ctrl.fetchIfStale(), ctrl.expireAll(), ctrl.invalidate(), ctrl.invalidateAll(), ctrl.setResponse(), ctrl.set().

## Programmatic queries

```ts
const queryRemainingTodos = new Query(
  TodoResource.getList.schema,
  entries => entries.filter(todo => !todo.completed).length,
);

const allRemainingTodos = useQuery(queryRemainingTodos);
const firstUserRemainingTodos = useQuery(queryRemainingTodos, { userId: 1 });
```

```ts
const groupTodoByUser = new Query(
  TodoResource.getList.schema,
  todos => Object.groupBy(todos, todo => todo.userId),
);
const todosByUser = useQuery(groupTodoByUser);
```

---

## Managers

Custom [Managers](https://dataclient.io/docs/api/Manager) allow for global side effect handling.
This is useful for webosckets, SSE, logging, etc. Always use the skill "rdc-manager" when writing managers.

## Best Practices & Notes

- [useDebounce(query, timeout)](https://dataclient.io/docs/api/useDebounce) when rendering async data based on user field inputs
- [[handleSubmit, loading, error] = useLoading()](https://dataclient.io/docs/api/useLoading) when tracking async mutations
- Prefer smaller React components that do one thing

# References

For detailed API documentation, see the [references](references/) directory:

- [useSuspense](references/useSuspense.md);[_pagination.mdx](references/_pagination.mdx) - Fetch with Suspense
- [useQuery](references/useQuery.md) - Read from cache without fetch
- [useCache](references/useCache.md) - Read from cache (nullable)
- [useLive](references/useLive.md);[_useLive.mdx](references/_useLive.mdx) - Fetch + subscribe to updates
- [useController](references/useController.md) - Access Controller
- [Controller](references/Controller.md) - Imperative actions
- [AsyncBoundary](references/AsyncBoundary.md);[_AsyncBoundary.mdx](references/_AsyncBoundary.mdx) - Error/loading boundary
- [useLoading](references/useLoading.md);[_useLoading.mdx](references/_useLoading.mdx) - Track async mutation state
- [useDebounce](references/useDebounce.md) - Debounce values
- [DataProvider](references/DataProvider.md) - Root provider
- [data-dependency](references/data-dependency.md) - Rendering guide
- [mutations](references/mutations.md);[_VoteDemo.mdx](references/_VoteDemo.mdx) - Mutations guide

**ALWAYS follow these patterns and refer to the official docs for edge cases. Prioritize code generation that is idiomatic, type-safe, and leverages automatic normalization/caching via skill "rdc-schema" definitions.**
