---
name: data-client-react
description: Use @data-client/react hooks for data fetching, mutations, and rendering - useSuspense, useFetch, useQuery, useCache, useLive, useDLE, useSubscription, useController, DataProvider, AsyncBoundary, useLoading, useDebounce. Use when reading/rendering remote data, triggering mutations, doing optimistic updates, real-time subscriptions, wiring Suspense/error boundaries, or SSR/streaming hydration (Next.js App Router, renderToPipeableStream, RSC, Anansi, HYDRATE, StateDelta).
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

For API definitions (like TodoResource), apply the skill "data-client-rest".

## Which hook

Same choice on the client and under SSR. Co-locate the hook in the island that renders the data. Do not pick a different hook “because SSR.”

| Need | Hook | SSR |
| --- | --- | --- |
| Guaranteed data (Suspense) | `useSuspense` | Same. Cache is seeded by streamed baseline + `StateDelta`s, not one `initialState`. A miss still `FETCH`es until per-key waiters land. |
| Fresh + live (poll/WS/SSE) | `useLive` | Same: `useSuspense` + `SUBSCRIBE` after commit. `SUBSCRIBE` is not hydration. |
| Cache only, nullable | `useCache` | Same. No fetch. |
| Derived/aggregate from cache | `useQuery` | Same. No fetch. |
| `{ data, loading, error }` | `useDLE` | Same. Still fetches on miss; never a waiter. |
| Parallel `use()` | `useFetch` | Same. Still fetches on miss; never a waiter. |
| Subscribe only | `useSubscription` | Same. Pair with `useSuspense` or `useDLE`. |
| Imperative / mutations | `useController` → `ctrl.fetch()` | Same. Never a waiter. |

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

Prefer using [AsyncBoundary](references/AsyncBoundary.md) for error handling and loading states unless the codebase has
a custom AsyncBoundary that already combines Suspense and ErrorBoundary.
Its props are `fallback`, `errorComponent`, and `errorClassName` and `listen`. It can be used to wrap any component that fetches data.

```tsx
<AsyncBoundary listen={history.listen}>
  <TodoList />
</AsyncBoundary>
```

## Provider

| Host | Import | SSR |
| --- | --- | --- |
| Browser / Vite / Expo | `@data-client/react` | Same provider. `managers={() => [...]}` preferred (array transitional). Optional one-shot `initialState` for tests. |
| Next.js App Router | `@data-client/react/nextjs` | Same hooks below it. `managers` **must** be a factory — never a shared array. Store arrives as inert baseline + per-flush `StateDelta`s; do not replace `initialState` on each delta. One provider per document. |
| `renderToPipeableStream` (Express, Anansi) | `@data-client/react/ssr` | Same hooks. Today a one-shot snapshot (`useReadyCacheState` / `awaitInitialData`). Intended: same baseline+delta protocol as App Router. |

Pages Router (`@data-client/ssr/nextjs`) stays one-shot. Streamed deltas apply to App Router; generic `renderToPipeableStream` is intended to share that protocol.

## Type-safe imperative actions

[Controller](references/Controller.md) is returned from `useController()`. It has:
ctrl.fetch(), ctrl.fetchIfStale(), ctrl.expireAll(), ctrl.invalidate(), ctrl.invalidateAll(), ctrl.setResponse(), ctrl.set(),
ctrl.setError(), ctrl.resetEntireStore(), ctrl.subscribe(), ctrl.unsubscribe().

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
This is useful for webosckets, SSE, logging, etc. Always use the skill "data-client-manager" when writing managers.

Managers are the same under SSR. Do not start channel work before `SUBSCRIBE`. Do not treat `SUBSCRIBE` as SSR hydration. [`NetworkManager`](https://dataclient.io/docs/api/NetworkManager) only dedupes in-flight client `FETCH`; it does not dedupe against SSR.

## SSR (same as client)

SSR is not a second data API. Components keep `useSuspense` / `useLive` in the island. The store hydrates incrementally: an inert baseline in the shell, then a `StateDelta` per committed server revision, folded into the hydration snapshot and `HYDRATE`’d into the live store. Same hooks; streamed baseline+deltas instead of one `initialState`.

Canonical figures: [docs/core/guides/ssr.md#streamed-hydration](https://dataclient.io/docs/guides/ssr#streamed-hydration) (overview, then one zoom per black box). Say **RSC** and **`renderToPipeableStream`** — never Flight/Fizz.

### Fetch vs cache

| Cache | Client | SSR |
| --- | --- | --- |
| Hit | render | Same |
| Stale | fetch, no suspend | Same |
| Invalid / missing | `FETCH` + suspend | Same **this release**. Intended: while the initial stream is open, `useSuspense` waits on **that** endpoint key instead of `FETCH`. Hits never allocate a waiter. |
| `null` args | no bind | Same |

`useDLE`, `useFetch`, and `ctrl.fetch()` always fetch on miss — client and SSR. Do not add endpoint or schema options for streaming; a waiter is internal to `useSuspense`’s would-fetch path (including `useLive`).

### Subscribe

`useLive` / `useSubscription` dispatch `SUBSCRIBE` after commit. Same on SSR. Subscription is not proof the server delta arrived, and it does not mean “SSR data is here.”

### Do / do not

- Put the Next `DataProvider` in the root layout. `managers={() => [...getDefaultManagers(), ...]}`.
- Keep `useSuspense` / `useLive` in the island that renders the data. Same as client.
- Let `NetworkManager` handle in-flight client `FETCH` only.
- Do not replace `DataProvider` `initialState` on each delta.
- Do not treat `useServerInsertedHTML` as ordering state before RSC.
- Do not buffer the shell, HTML, or RSC until all endpoints are known.
- A document-wide `DOMContentLoaded` wait is an acceptable **interim** while per-key waiters are unshipped. It is not the long-term contract, and it does not gate the provider, hits, or manager startup.

Per-key `useSuspense` waiters and fold-on-script-arrival (independent of `StreamedStateReceiver`’s layout effect) are **not shipped**. Incremental baseline+delta for generic `renderToPipeableStream` / Anansi is not shipped. An RSC-first miss fetches like any client render; expiry cannot retract a `FETCH` already started from the empty baseline.

## Best Practices & Notes

- [useDebounce(query, timeout)](references/useDebounce.md) when rendering async data based on user field inputs
- [[handleSubmit, loading, error] = useLoading()](references/useLoading.md) when tracking async mutations
- Prefer smaller React components that do one thing
- **Co-locate data bindings**: call useSuspense/useDLE/useCache/useQuery in the component that renders the data — don't prop drill
- **Don't hide data bindings inside custom hooks**: wrapping them obfuscates a component's data dependencies and couples data logic to view code, causing drift. Put tightly coupled data transformations in a `Query` schema (with the data model, e.g. `src/resources/`) so they stay reusable and evolve independently of views

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
- [SSR guide](https://dataclient.io/docs/guides/ssr#streamed-hydration) - Streamed hydration figures (baseline + `StateDelta`)
- [data-dependency](references/data-dependency.md) - Rendering guide
- [mutations](references/mutations.md);[_VoteDemo.md](references/_VoteDemo.md) - Mutations guide
- [Actions](references/Actions.md) - Store action types (FETCH, SET, etc.)
- [devtools-debugging](references/devtools-debugging.md) - Debug with Chrome DevTools MCP

**ALWAYS follow these patterns and refer to the official docs for edge cases. Prioritize code generation that is idiomatic, type-safe, and leverages automatic normalization/caching via skill "data-client-schema" definitions.**
