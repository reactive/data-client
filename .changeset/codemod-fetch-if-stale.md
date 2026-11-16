---
'@data-client/codemods': patch
---

Migrate [Controller.fetchIfStale()](https://dataclient.io/docs/api/Controller#fetchIfStale) results read without `await` in the `v0.19` codemod

`fetchIfStale()` always returns a Promise in 0.19. Where an `instanceof Promise` or `isPromise()` check on its result
has a branch that awaits the result and reads the data (or the other branch is empty), the codemod keeps that branch and
deletes the other:

```ts
const issue = ctrl.fetchIfStale(IssueResource.get, { id });
if (issue instanceof Promise) {
  setTitle((await issue).title);
} else {
  setTitle(issue.title);
}
// becomes
const issue = ctrl.fetchIfStale(IssueResource.get, { id });
setTitle((await issue).title);
```

It adds a `TODO(data-client)` comment above other code that reads the result as the data: other `instanceof Promise`
checks, members other than `then`/`catch`/`finally`, destructuring, conditions, spreads and templates. Where to
`await` depends on the code around it, so it doesn't rewrite them.

An awaited call now rejects when the latest fetch failed, where it used to resolve `undefined`. The codemod adds a
`TODO(data-client)` comment above code that handled a missing awaited result, such as `?? fallback` or `if (!data)`.

It also unwraps `Promise.resolve(ctrl.fetchIfStale(...))`, and makes mocks resolve their value:
`spyOn(ctrl, 'fetchIfStale').mockReturnValue()` becomes `.mockResolvedValue()`, and
`fetchIfStale: jest.fn(() => data)` becomes `jest.fn(() => Promise.resolve(data))`.
