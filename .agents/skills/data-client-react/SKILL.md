---
name: data-client-react
description: Use @data-client/react hooks for data fetching, mutations, and rendering - useSuspense, useFetch, useQuery, useCache, useLive, useDLE, useSubscription, useController, DataProvider, AsyncBoundary, useLoading, useDebounce. Use when reading/rendering remote data, triggering mutations, doing optimistic updates, real-time subscriptions, or wiring Suspense/error boundaries in React.
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
// fetch without Suspense - returns { data, loading, error }
const { data, loading, error } = useDLE(TodoResource.get, { id: 5 });
// subscribe without Suspense (use with useSuspense or useDLE)
useSubscription(TodoResource.get, { id: 5 });
// parallel fetches with React.use()
const postPromise = useFetch(PostResource.get, { id });
const commentsPromise = useFetch(CommentResource.getList, { postId: id });
const post = use(postPromise);
const comments = use(commentsPromise);
```

Sequential `useSuspense` calls waterfall (each suspends before the next starts its fetch). For 2+
endpoints in one component, call `useFetch` for each first so all requests start, then `use()` each
promise as above (React 19+). On older React, follow those `useFetch` calls with a `useSuspense` for each;
the requests are already in flight, so suspending on the first no longer delays the rest.

For API definitions (like TodoResource), apply the skill "data-client-rest".

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
    <IssueList query={debouncedQuery} owner="react" repo="react" />
  </AsyncBoundary>
)
```

## Components

Prefer using [AsyncBoundary](references/AsyncBoundary.md) for error handling and loading states unless the codebase has
a custom AsyncBoundary that already combines Suspense and ErrorBoundary.
Its props are `fallback`, `errorComponent`, `errorClassName`, and `listen`. It can be used to wrap any component that fetches data.

```tsx
<AsyncBoundary listen={history.listen}>
  <TodoList />
</AsyncBoundary>
```

## Type-safe imperative actions

[Controller](references/Controller.md) is returned from `useController()`. It has:
ctrl.fetch(), ctrl.fetchIfStale(), ctrl.expireAll(), ctrl.invalidate(), ctrl.invalidateAll(), ctrl.setResponse(), ctrl.set(),
ctrl.setError(), ctrl.resetEntireStore(), ctrl.subscribe(), ctrl.unsubscribe().

| To refresh or update | Call |
|---|---|
| You already have the new value | `ctrl.set()` / `ctrl.setResponse()` - no network |
| One known endpoint+args, keep showing current data | `ctrl.fetch(endpoint, args)` |
| Every cached args of an endpoint, keep showing current data | `ctrl.expireAll(endpoint)` - only fetching hooks (`useSuspense`/`useFetch`/`useDLE`/`useLive`) refetch; `useCache`/`useQuery` don't |
| Showing the current data would be wrong | `ctrl.invalidate()` / `ctrl.invalidateAll()` - mounted `useSuspense` suspends |

Write many entities without a fetch with one `ctrl.set([Entity], rows)`. Never loop `ctrl.set(Entity, args, row)` per row, and never add an endpoint or `setResponse()` just to batch.

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

## Browser Debugging (Chrome DevTools MCP)

To inspect store state, track dispatched [actions](references/Actions.md), or invoke
[Controller](references/Controller.md) methods from a browser MCP (`user-chrome-devtools`),
see [devtools-debugging](references/devtools-debugging.md). Uses `globalThis.__DC_CONTROLLERS__`
available in dev mode.

## Managers

Custom [Managers](https://dataclient.io/docs/api/Manager) allow for global side effect handling.
This is useful for websockets, SSE, logging, etc. Always use the skill "data-client-manager" when writing managers.
Write external event streams (websocket, SSE, workers, timers) into the store with `ctrl.set()`, never into
React state. A single bridge component may own the listener in an effect (with cleanup); use a Manager when
several components need the stream or it must outlive the component.

## Best Practices & Notes

- [useDebounce(query, timeout)](references/useDebounce.md) when rendering async data based on user field inputs
- [[handleSubmit, loading, error] = useLoading()](references/useLoading.md) when tracking async mutations
- Prefer smaller React components that do one thing
- **Co-locate data bindings**: call useSuspense/useDLE/useCache/useQuery in the component that renders the data — don't prop drill. Pass ids/args as props instead of threading fetched data through components that don't render it (a list passing each item to its row is fine); components binding the same endpoint and args share one fetch and one cache entry
- **Don't hide data bindings inside custom hooks**: wrapping them obfuscates a component's data dependencies and couples data logic to view code, causing drift. Put tightly coupled data transformations in a `Query` schema (with the data model, e.g. `src/resources/`) so they stay reusable and evolve independently of views
- For tests, apply the skill "data-client-react-testing"

## Common Mistakes to Avoid

- **Treating a cache miss as "doesn't exist"**: `useCache`/`useQuery` return `undefined` for anything not yet fetched or set this session, and a deep link or refresh starts empty. Read required data with `useSuspense`/`useDLE`; use `useCache`/`useQuery` only for data another binding guarantees, or when "loaded yet?" is the question.
- **`useEffect` + `ctrl.fetch` (+ `useState`) to load data**: it ignores staleness (refetches on every effect run) and the copied state stops tracking the store. Read with a binding hook; call `ctrl.fetch` from event handlers.
- **`useSuspense` in persistent chrome outside every `AsyncBoundary`** (nav, header, breadcrumbs): it suspends up to the root and blanks the whole shell. Use `useDLE` or `useCache` there.
- **Expecting `AsyncBoundary` to clear its error when a prop changes**: error state doesn't reset when props change; it resets on `listen` or `resetErrorBoundary`. When the boundary's content switches by prop (selected id), add `key={id}` to the boundary.
- **Building lookup `Map`s from list results**: use [Entity.indexes](https://dataclient.io/rest/api/Entity#indexes) or a `Query` (skill "data-client-schema"). In event handlers, read a `Query` with `ctrl.get(query, args, ctrl.getState())` instead of rescanning a fetched list.

# References

For detailed API documentation, see the [references](references/) directory:

- [useSuspense](references/useSuspense.md);[_pagination.md](references/_pagination.md) - Fetch with Suspense
- [useFetch](references/useFetch.md) - Fetch for React.use() and parallel loading
- [useQuery](references/useQuery.md) - Read from cache without fetch
- [useCache](references/useCache.md) - Read from cache (nullable)
- [useLive](references/useLive.md);[_useLive.md](references/_useLive.md) - Fetch + subscribe to updates
- [useDLE](references/useDLE.md) - Fetch without Suspense (returns data/loading/error)
- [useSubscription](references/useSubscription.md) - Subscribe to updates (polling/websocket/SSE)
- [useController](references/useController.md) - Access Controller
- [Controller](references/Controller.md) - Imperative actions
- [AsyncBoundary](references/AsyncBoundary.md);[_AsyncBoundary.md](references/_AsyncBoundary.md) - Error/loading boundary
- [useLoading](references/useLoading.md);[_useLoading.md](references/_useLoading.md) - Track async mutation state
- [useDebounce](references/useDebounce.md) - Debounce values
- [DataProvider](references/DataProvider.md) - Root provider
- [data-dependency](references/data-dependency.md) - Rendering guide
- [mutations](references/mutations.md);[_VoteDemo.md](references/_VoteDemo.md) - Mutations guide
- [Actions](references/Actions.md) - Store action types (FETCH, SET, etc.)
- [devtools-debugging](references/devtools-debugging.md) - Debug with Chrome DevTools MCP

**ALWAYS follow these patterns and refer to the official docs for edge cases. Prioritize code generation that is idiomatic, type-safe, and leverages automatic normalization/caching via skill "data-client-schema" definitions.**
