---
name: data-client-vue
description: Use @data-client/vue composables for data fetching, mutations, and rendering - useSuspense, useFetch, useQuery, useCache, useLive, useDLE, useSubscription, useController, useLoading, useDebounce, DataClientPlugin, Suspense, onErrorCaptured. Use when reading/rendering remote data, triggering mutations, doing optimistic updates, real-time subscriptions, or wiring Suspense and error handling in Vue 3.
license: Apache 2.0
---
## Setup

Install `DataClientPlugin` once with `app.use(DataClientPlugin)` ([installation](references/installation.md);
apply the skill "data-client-setup" to set it up). Composables only work inside `<script setup>` of components
below it. Awaiting composables (`await useSuspense()`) requires `<script setup>`: in a hand-written
`async setup()`, composables called after the first `await` lose the component instance.

## Rendering

```ts
// GET https://jsonplaceholder.typicode.com/todos/5
const todo = await useSuspense(TodoResource.get, { id: 5 });
// GET https://jsonplaceholder.typicode.com/todos
const todoList = await useSuspense(TodoResource.getList);
// GET https://jsonplaceholder.typicode.com/todos?userId=1
const todoListByUser = await useSuspense(TodoResource.getList, { userId: 1 });
// subscriptions with polling, websockets or SSE
const todo = await useLive(TodoResource.get, { id: 5 });
// without fetch (not awaited)
const todo = useCache(TodoResource.get, { id: 5 });
const todo = useQuery(Todo, { id: 5 });
// fetch without Suspense - returns { data, loading, error } refs
const { data, loading, error } = useDLE(TodoResource.get, { id: 5 });
// subscribe without Suspense (use with useSuspense or useDLE)
useSubscription(TodoResource.get, { id: 5 });
// parallel fetches: start both, then await
useFetch(PostResource.get, { id });
useFetch(CommentResource.getList, { postId: id });
const post = await useSuspense(PostResource.get, { id });
const comments = await useSuspense(CommentResource.getList, { postId: id });
// conditional: null skips fetching and binding
const user = await useSuspense(UserResource.get, computed(() => (userId.value ? { id: userId.value } : null)));
```

For API definitions (like TodoResource), apply the skill "data-client-rest".

### Return values are refs

- `useSuspense()` and `useLive()` return a `Promise` of a readonly `ComputedRef`: `await` them at the top
  level of `<script setup>`. `useCache()`, `useQuery()`, and each of `useDLE()`'s `data`/`loading`/`error`
  are `ComputedRef`s.
- Templates unwrap them (`{{ todo.title }}`); in script read `.value` (`todo.value.title`).

### Reactive arguments

Arguments can be plain values, `ref`s, or `computed`s. A plain object is read once, so it will not
refetch when a prop or route param changes. Whenever an argument depends on reactive state, pass a
`computed()` or `ref()` (not a bare getter function like `() => ({ id })`):

```ts
const props = defineProps<{ id: number }>();
// refetches when props.id changes
const todo = await useSuspense(TodoResource.get, computed(() => ({ id: props.id })));
```

When arguments change, `useSuspense()` and `useLive()` keep the previous data until the new fetch resolves
(no `v-if` guard needed); a failed fetch for the new arguments reaches `onErrorCaptured()`.

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

Read reactive values (`props.todo.id`, `title.value`) inside the handler so each call uses current state.
The Controller is also available as `$dataClient` in any template (and `this.$dataClient` in the Options API).

## Helpful composables

```ts
const ctrl = useController();
const [handleSubmit, loading, error] = useLoading(async (data: FormData) => {
  const post = await ctrl.fetch(PostResource.getList.push, data);
  router.push(`/posts/${post.id}`);
});
// loading and error are refs
```

```ts
const query = ref(''); // bound with v-model
const [debouncedQuery, isPending] = useDebounce(query, 200);
// pass debouncedQuery to the component that fetches, inside <Suspense>
```

## Loading and error boundaries

There is no `AsyncBoundary` component in Vue. A component that `await`s `useSuspense()` or `useLive()`
must render inside Vue's [`<Suspense>`](https://vuejs.org/guide/built-ins/suspense.html); its
`#fallback` slot is the loading state. Catch fetch errors in an ancestor with
[`onErrorCaptured()`](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured).
Reuse the codebase's existing boundary component if it has one; otherwise follow the
[boundary example](references/_AsyncBoundary.md) (`onErrorCaptured` stores the error and returns `false`;
the template shows it or renders `<Suspense>`). Place boundaries around route views or sections, not around
each data-bound component ([boundaries](references/data-dependency.md#boundaries)).

## Type-safe imperative actions

[Controller](references/Controller.md) is returned from `useController()`. It has:
ctrl.fetch(), ctrl.fetchIfStale(), ctrl.expireAll(), ctrl.invalidate(), ctrl.invalidateAll(), ctrl.setResponse(), ctrl.set(),
ctrl.setError(), ctrl.resetEntireStore(), ctrl.subscribe(), ctrl.unsubscribe().

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
This is useful for websockets, SSE, logging, etc. Pass them to `DataClientPlugin` with
[getDefaultManagers](references/getDefaultManagers.md). Always use the skill "data-client-manager" when writing managers.

## Best Practices & Notes

- [useDebounce(query, timeout)](references/useDebounce.md) when rendering async data based on user field inputs
- [[handleSubmit, loading, error] = useLoading()](references/useLoading.md) when tracking async mutations
- Prefer smaller Vue components that do one thing
- **Co-locate data bindings**: call useSuspense/useDLE/useCache/useQuery in the component that renders the data — don't prop drill
- **Don't hide data bindings inside custom composables**: wrapping them obfuscates a component's data dependencies and couples data logic to view code, causing drift. Put tightly coupled data transformations in a `Query` schema (with the data model, e.g. `src/resources/`) so they stay reusable and evolve independently of views
- Don't copy results into `ref()`/`reactive()` state; render the returned refs directly so updates flow through
- For tests, apply the skill "data-client-vue-testing"

# References

For detailed API documentation, see the [references](references/) directory. They cover React and Vue;
read the `:::vue` sections.

- [useSuspense](references/useSuspense.md);[_pagination.md](references/_pagination.md) - Fetch with Suspense
- [useFetch](references/useFetch.md) - Start fetches early for parallel loading
- [useQuery](references/useQuery.md) - Read from cache without fetch
- [useCache](references/useCache.md) - Read from cache (nullable)
- [useLive](references/useLive.md);[_useLive.md](references/_useLive.md) - Fetch + subscribe to updates
- [useDLE](references/useDLE.md) - Fetch without Suspense (returns data/loading/error)
- [useSubscription](references/useSubscription.md) - Subscribe to updates (polling/websocket/SSE)
- [useController](references/useController.md) - Access Controller
- [Controller](references/Controller.md) - Imperative actions
- [_AsyncBoundary.md](references/_AsyncBoundary.md) - Suspense and onErrorCaptured boundaries
- [useLoading](references/useLoading.md);[_useLoading.md](references/_useLoading.md) - Track async mutation state
- [useDebounce](references/useDebounce.md) - Debounce values
- [installation](references/installation.md) - Install `DataClientPlugin`
- [getDefaultManagers](references/getDefaultManagers.md) - Configure `DataClientPlugin` managers
- [data-dependency](references/data-dependency.md) - Rendering guide
- [mutations](references/mutations.md);[_VoteDemo.md](references/_VoteDemo.md) - Mutations guide
- [Actions](references/Actions.md) - Store action types (FETCH, SET, etc.)
- [devtools-debugging](references/devtools-debugging.md) - Debug with Chrome DevTools MCP

**ALWAYS follow these patterns and refer to the official docs for edge cases. Prioritize code generation that is idiomatic, type-safe, and leverages automatic normalization/caching via skill "data-client-schema" definitions.**
