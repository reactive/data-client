---
'@data-client/codemods': patch
---

Flag [Controller.fetchIfStale()](https://dataclient.io/docs/api/Controller#fetchIfStale) results read without `await` in the `v0.19` codemod

`fetchIfStale()` always returns a Promise in 0.19. The codemod adds a `TODO(data-client)` comment above code that reads
its result as the data: `instanceof Promise`, members other than `then`/`catch`/`finally`, destructuring, conditions,
spreads and templates. Where to `await` depends on the code around it, so it doesn't rewrite them. It also unwraps
`Promise.resolve(ctrl.fetchIfStale(...))`, and turns `spyOn(ctrl, 'fetchIfStale').mockReturnValue()` into
`.mockResolvedValue()`.

```ts
const issue = ctrl.fetchIfStale(IssueResource.get, { id });
// TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: https://dataclient.io/blog/2026/10/03/v0.19-batch-set#fetch-if-stale-promise
if (!(issue instanceof Promise)) render(issue);
```
