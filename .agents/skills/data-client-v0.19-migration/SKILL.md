---
name: data-client-v0.19-migration
description: Upgrade @data-client apps to v0.19. Runs the v0.19 codemod, then fixes what it flags and what it can't see. Use when bumping @data-client packages to 0.19, or when code around Controller.fetchIfStale() breaks after upgrading.
---

# @data-client v0.19 Migration

Every breaking change, with Before/After code: [v0.19 migration guide](https://dataclient.io/blog/2026/10/03/v0.19-batch-set#migration-guide).

## Step 1: run the codemod

Commit first so you can review the diff, then point the codemod at your source roots, not the repo root (it skips only
`node_modules`):

```bash
npx @data-client/codemods v0.19 <source-root>
```

It parses JavaScript and TypeScript only, so migrate code in `.vue` and other single-file components by hand. It skips
files without an `@data-client/*` import.

## Step 2: `Controller.fetchIfStale()` always returns a Promise

It used to return the data synchronously when fresh. Now it always returns a Promise, and a call you don't await never
rejects unhandled: the error is stored for components, like any fetch error.
[Details](https://dataclient.io/blog/2026/10/03/v0.19-batch-set#fetch-if-stale-promise).

- **Fix each `TODO(data-client): fetchIfStale()` comment** the codemod left. The code below it reads the result as data
  (`instanceof Promise`, a field, destructuring, an `if`). `await` the call where the data is needed, delete the branch
  that handled synchronous data, then delete the comment.
- **Search `fetchIfStale(` for reads the codemod can't follow**: results passed to helpers such as `isPromise(x)`, or
  stored on objects. To check freshness without fetching, use `ctrl.getResponse(endpoint, args, ctrl.getState())`.
- **Don't add `.catch()` to calls you don't await.** A `.then()` chain makes a new Promise, so it still ends in
  `.catch()`.
- **Awaited calls now reject** when the latest fetch failed within errorExpiryLength (they used to resolve `undefined`).
  In a router loader, the router's error UI shows it. To keep waiting but leave the error to the component's boundary,
  use `await ctrl.fetchIfStale(endpoint, args).catch(() => {})`.
- **Error monitoring**: unawaited failures no longer reach global unhandled-rejection handlers (Sentry and similar). If
  the app uses an error tracker and has no Manager that reports fetch errors, add the
  [error reporting Manager](https://dataclient.io/docs/concepts/managers#error-reporting).
- **Controller subclasses** that override `fetchIfStale()` must return a Promise.

```ts
// Before
const issue = ctrl.fetchIfStale(IssueResource.get, { id });
if (!(issue instanceof Promise)) render(issue);
// After
const issue = await ctrl.fetchIfStale(IssueResource.get, { id });
render(issue);
```

## Step 3: verify

1. Search for `TODO(data-client)`: none should remain.
2. Run the type checker. Property reads on a `fetchIfStale()` result now fail to type-check, since it is a Promise.
3. Run the tests. The codemod turns `spyOn(ctrl, 'fetchIfStale').mockReturnValue()` into `.mockResolvedValue()`; fix
   other mocks of `fetchIfStale` the same way.
