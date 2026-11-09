---
'@data-client/codemods': patch
---

Flag [Controller.fetchIfStale()](https://dataclient.io/docs/api/Controller#fetchIfStale) results read without `await` in the `v0.19` codemod

`fetchIfStale()` always returns a Promise in 0.19, so an `instanceof Promise` check of its result is always true. The
codemod adds a `TODO(data-client)` comment above each such check, since the fix (`await`) depends on the code around it.
It also unwraps `Promise.resolve(ctrl.fetchIfStale(...))`, which is no longer needed to chain `.catch()`.

```ts
const issue = ctrl.fetchIfStale(IssueResource.get, { id });
// TODO(data-client): fetchIfStale() always returns a Promise since 0.19, so this check is always true; await it: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#fetch-if-stale-promise
if (!(issue instanceof Promise)) render(issue);
```
