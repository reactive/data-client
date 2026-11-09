---
name: data-client-v0.19-migration
description: Upgrade apps that already use @data-client to v0.19. Runs the v0.19 codemod, then fixes what it flags and what it can't see. Use when bumping @data-client packages to 0.19, or when code around Controller.fetchIfStale() breaks after upgrading. Not for adopting Data Client for the first time.
---

# @data-client v0.19 Migration

Every breaking change, with Before/After code: [v0.19 migration guide](https://dataclient.io/blog/2026/10/03/v0.19-batch-set#migration-guide).

## Step 1: bump and run the codemod

Bump every `@data-client/*` package to `^0.19.0` together. Commit first so you can review the diff, then point the
codemod at your source roots, not the repo root (it skips only `node_modules`):

```bash
npx @data-client/codemods v0.19 <source-root>
```

`0 errors, N unmodified` is a clean run, not a failure. The codemod parses JavaScript and TypeScript only, and skips
files without an `@data-client/*` import; the searches below find what it skipped, including `.vue` and other
single-file components.

## Step 2: `Controller.fetchIfStale()` always returns a Promise

It used to return the data synchronously when fresh. Now it always returns a Promise, and a call you don't await never
rejects unhandled: the error is stored for components, like any fetch error.
[Details](https://dataclient.io/blog/2026/10/03/v0.19-batch-set#fetch-if-stale-promise).

Skip this step if `rg -n 'fetchIfStale' <source-root>` finds nothing.

- **Fix each `TODO(data-client): fetchIfStale()` comment** the codemod left. The code below it reads the result as data
  (`instanceof Promise`, a field, destructuring, an `if`). `await` the call where the data is needed, delete the branch
  that handled synchronous data, then delete the comment.
- **Check every other `fetchIfStale(` call for reads the codemod can't follow**: results passed to a function (such as
  an `isPromise(x)` helper), stored on an object or class field, or in files and components it skipped. A sync-data
  branch behind such a check now never runs, and nothing fails to type-check. To check freshness without fetching, use
  `ctrl.getResponse(endpoint, args, ctrl.getState())`.
- **Don't add `.catch()` to calls you don't await.** A `.then()` chain makes a new Promise, so it still ends in
  `.catch()`.
- **Awaited calls now reject** when the latest fetch failed within errorExpiryLength; they used to resolve `undefined`.
  Code after an `await` that handled a missing result (`?? fallback`, `if (!data)`) gets a rejection instead, so move
  that handling into a `.catch()` or `try`/`catch`. Leave other awaited calls alone: a router shows its error UI.
- **Error monitoring**: unawaited failures no longer reach global unhandled-rejection handlers (Sentry and similar). If
  the app uses an error tracker, say so in your summary and suggest the
  [error reporting Manager](https://dataclient.io/docs/concepts/managers#error-reporting). Don't add it unasked: it
  reports every failed fetch, not only these.
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

1. Search for `TODO(data-client)`: none should remain. Search for `instanceof Promise`, `isPromise` and `.then ===`
   near `fetchIfStale`: each one is a sync-data branch that no longer runs.
2. Run the type checker. Property reads on a `fetchIfStale()` result now fail to type-check, since it is a Promise.
3. Run the tests. The codemod turns `spyOn(ctrl, 'fetchIfStale').mockReturnValue()` into `.mockResolvedValue()`; make
   other `fetchIfStale` mocks, such as `{ fetchIfStale: jest.fn(() => data) }`, resolve their value the same way.

## Reference

- Codemod source: [`packages/codemods/src/transforms/v0.19.js`](https://github.com/reactive/data-client/blob/master/packages/codemods/src/transforms/v0.19.js)
