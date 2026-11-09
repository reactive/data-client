---
'@data-client/core': minor
'@data-client/react': minor
'@data-client/vue': minor
---

BREAKING: [Controller.fetchIfStale()](https://dataclient.io/docs/api/Controller#fetchIfStale) always returns a Promise, and is safe to call without awaiting

Prefetching a secondary request in a route loader or event handler now works the same whether the data is fresh or
stale. Before, fresh data came back synchronously, so `.catch()` threw a `TypeError`; and a failed fetch that nobody
awaited was an unhandled promise rejection. Now a call you don't await never rejects unhandled: the error is stored like
any fetch error, so components reading that endpoint handle it as usual. Calls that `await` the result still reject,
including while a recent failure is cached (before, they got `undefined`).

```ts
async function issueLoader(ctrl: Controller, id: number) {
  // start the comments request without waiting for it; no .catch() needed
  ctrl.fetchIfStale(CommentResource.getList, { issueId: id });
  // wait for the issue; rejects if its fetch fails
  await ctrl.fetchIfStale(IssueResource.get, { id });
}
```

Why a Promise even for fresh data: one call can't both return data synchronously and support `.catch()`, and the
synchronous value was rarely usable. Its type was a union, so code had to check `instanceof Promise` first, and router
loaders (React Router, TanStack Router) await whatever they get anyway.

To check whether data is cached and fresh without fetching, use
[Controller.getResponse()](https://dataclient.io/docs/api/Controller#getResponse), which is synchronous:

```ts
const { data, expiryStatus, expiresAt } = ctrl.getResponse(
  IssueResource.get,
  { id },
  ctrl.getState(),
);
const fresh = expiryStatus !== ExpiryStatus.Invalid && Date.now() <= expiresAt;
```

If you read the result without awaiting it, `await` it:

#### Before

```ts
const issue = ctrl.fetchIfStale(IssueResource.get, { id });
if (!(issue instanceof Promise)) render(issue);
```

#### After

```ts
const issue = await ctrl.fetchIfStale(IssueResource.get, { id });
render(issue);
```
