---
'@data-client/core': patch
'@data-client/react': patch
---

[Controller.fetch()](https://dataclient.io/docs/api/Controller#fetch) of an endpoint without `sideEffect` never rejects unhandled

Like [fetchIfStale()](https://dataclient.io/docs/api/Controller#fetchIfStale), a read you don't await is now safe: its
error is stored, so components reading that endpoint show it. `await` and `.catch()` still get the error. Mutations
(`sideEffect: true`) still reject unhandled, since no component reads their error.

| Unawaited `fetch()` fails     | Before                                        | After                                |
| ----------------------------- | --------------------------------------------- | ------------------------------------ |
| Read (no `sideEffect`)        | Unhandled rejection; crashes Node SSR loaders | Error stored; no unhandled rejection |
| Mutation (`sideEffect: true`) | Unhandled rejection                           | Unhandled rejection                  |

This also fixes React Native's "Possible Unhandled Promise Rejection" warning when a refetch on screen focus fails in
[useSuspense()](https://dataclient.io/docs/api/useSuspense), [useDLE()](https://dataclient.io/docs/api/useDLE) or
[useFetch()](https://dataclient.io/docs/api/useFetch).

Failures of unawaited reads no longer reach global unhandled-rejection handlers (the console, Sentry, Node's
`unhandledRejection`). To report every failed fetch, add an
[error reporting Manager](https://dataclient.io/docs/concepts/managers#error-reporting).

#### Before

```ts
// .catch() kept a failed refresh from rejecting unhandled
const refresh = () => ctrl.fetch(TodoResource.getList).catch(() => {});
```

#### After

```ts
// the error is stored for the components rendering the list
const refresh = () => ctrl.fetch(TodoResource.getList);
```
