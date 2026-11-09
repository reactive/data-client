---
'@data-client/core': minor
'@data-client/react': minor
'@data-client/vue': minor
---

BREAKING: [Controller.fetchIfStale()](https://dataclient.io/docs/api/Controller#fetchIfStale) always returns a Promise, and is safe to call without awaiting

`fetchIfStale()` now always returns a Promise of the latest fetch's outcome, and fetches only when the cache is stale. A
call you don't await can't reject unhandled, because the error is already stored like any fetch error, so components
reading that endpoint handle it as usual.

| Question | Before | After |
| --- | --- | --- |
| What does the call return? | The data when fresh, a Promise when stale | Always a Promise |
| An unawaited call's fetch fails. What happens? | Unhandled rejection | No unhandled rejection; the error is stored, as before |
| What does `await` give when the latest fetch failed within [errorExpiryLength](https://dataclient.io/rest/api/Endpoint#errorexpirylength)? | `undefined` | Rejects with that error |
| How do I check freshness without fetching? | Check the result with `instanceof Promise` | [getResponse()](https://dataclient.io/docs/api/Controller#getResponse) |

```ts
async function issueLoader(ctrl: Controller, id: number) {
  // start the comments request without waiting for it; no .catch() needed
  ctrl.fetchIfStale(CommentResource.getList, { issueId: id });
  // wait for the issue; rejects if its fetch fails
  await ctrl.fetchIfStale(IssueResource.get, { id });
}
```

Why the synchronous return went away: `fetchIfStale()` first returned `undefined` for fresh data
([#2743](https://github.com/reactive/data-client/pull/2743)). [#2745](https://github.com/reactive/data-client/pull/2745)
returned the cached data instead, so that `await fetchIfStale()` resolves the data either way. The synchronous value was
a side effect of that fix, and `await` still works. Keeping it would mean the natural prefetch code breaks: one call
can't return plain data and also support `.catch()`. Its type was a union, so code had to check `instanceof Promise`
before using it, and router loaders (React Router, TanStack Router) await whatever they get anyway.

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

What to check when upgrading. `npx @data-client/codemods v0.19 src/` handles the first three:

- **Code that reads the result as data**, such as `instanceof Promise`, `.title`, destructuring or an `if` on it:
  `await` it. The codemod adds a `TODO(data-client)` comment above each one it finds. The type checker flags property
  reads it misses, like results passed through other functions.
- **Tests that mock the old return**: `spyOn(ctrl, 'fetchIfStale').mockReturnValue(data)` becomes
  `.mockResolvedValue(data)`.
- **`Promise.resolve(ctrl.fetchIfStale(...))`** wrappers are no longer needed, and the codemod removes them.
- **Error monitoring**: failures of calls you don't await no longer reach global unhandled-rejection handlers: the
  browser console's "Uncaught (in promise)" error, error trackers that capture unhandled rejections (like Sentry), and
  Node's `unhandledRejection` event. To report every failed fetch, awaited or not, add an
  [error reporting Manager](https://dataclient.io/docs/concepts/managers#error-reporting).
- **Loaders that await it** now reject when the latest fetch failed within errorExpiryLength, as they already did when
  a stale fetch failed, so the router's error UI shows the error instead of the component's error boundary. To keep
  waiting but leave the error to the component, add `.catch(() => {})` to that call.
- **`.then()` chains**: a `.then()` on the result makes a new Promise, so end the chain with `.catch()` as usual.
- **Controller subclasses** that override `fetchIfStale()` must return a Promise.

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
