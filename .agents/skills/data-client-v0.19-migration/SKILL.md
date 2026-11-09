---
name: data-client-v0.19-migration
description: Upgrade apps that already use @data-client to v0.19. Runs the v0.19 codemod, then fixes what it flags and what it can't see. Use when bumping @data-client packages to 0.19, or when Controller.fetchIfStale(), custom Managers or the managers prop break after upgrading. Not for adopting Data Client for the first time.
---

# @data-client v0.19 Migration

Every breaking change, with Before/After code:
[v0.19 migration guide](https://dataclient.io/blog/2026/10/03/v0.19-batch-set#migration-guide).

## Step 1: bump and run the codemod

Bump every `@data-client/*` package to `^0.19.0` together. `@data-client/test` now requires `@data-client/react` 0.19,
and `typescript` must be 4.0 or later. React Native projects that test with `@data-client/test` also need
`@testing-library/react-native`. If `@data-client/ssr` is installed, read Step 3 first.

Commit first so you can review the diff, then point the codemod at your source roots, not the repo root (it skips only
`node_modules`):

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

## Step 3: Next.js Pages Router is not supported

Skip this step unless the app uses `@data-client/ssr` (`DataClientDocument`, `AppDataProvider` in `pages/_document` or
`pages/_app`). It stops at `@data-client/react` 0.14, and 0.19 supports only the App Router: render `DataProvider` from
`@data-client/react/nextjs` in `app/layout.tsx`, then uninstall `@data-client/ssr` (and `@data-client/redux` if nothing
else uses it). Moving pages to the App Router is a routing migration, so confirm with the owner before starting it.
[Details](https://dataclient.io/blog/2026/10/03/v0.19-batch-set#nextjs-pages-router).

## Step 4: Managers define `middleware`

Skip steps 4 and 5 if
`rg -n 'implements Manager|extends \w*Manager|: Manager\b|getMiddleware|cleanupDate' <source-root>` finds nothing.

`getMiddleware()` is removed. Rename it to a `middleware` property. A Manager with no `middleware` fails to type-check
and throws when `DataProvider` mounts in development; give one that only reacts to `init()`/`cleanup()` a pass-through,
`middleware: Middleware = () => next => next`.
[Details](https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-middleware).

## Step 5: Manager `cleanup()` pauses; it doesn't end the store

StrictMode and `<Activity>` call `cleanup()` and later `init()` on the same store, which keeps applying actions in
between. [Details](https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-cleanup).

- **Start timers, sockets and listeners in `init()`**, not in the constructor or `middleware`, and stop them in
  `cleanup()`. Otherwise they stay stopped after a resume.
- **Don't reset state about the store in `cleanup()`**, such as caches of in-flight fetches. `init(state)` gets the
  store's current state, including on resume, not the initial state.
- **Guard side effects in `middleware`** with a field `cleanup()` clears (`this.socket?.send()`), since actions can
  still arrive after `cleanup()`.
- **Delete code that reads or sets `NetworkManager.cleanupDate`**; it's removed.
- **After unmount, don't `await`** `set()`, `setResponse()`, `resetEntireStore()` or `fetch()` of an endpoint without
  `sideEffect`: on React 18+ they never resolve.

## Step 6: `managers` is a function

The codemod converts `managers` arrays, but check what it wrapped. `DataProvider`, `DataClientPlugin` and
`prepareStore()` call the function once per store, so each store gets new Managers. Where the codemod wrote
`() => managers` around an array built elsewhere, the stores still share those instances: move each `new` into the
function, kept at module level. [Details](https://dataclient.io/blog/2026/10/03/v0.19-batch-set#managers-function).

## Step 7: test helpers

- **`renderDataHook()` now runs its `managers`**; before, it ignored them. The list replaces the defaults, so it must
  include a `NetworkManager` (it throws otherwise), and the test's Managers now act on its actions.
- **A custom Provider passed to `makeRenderDataHook()`** must accept `managers: () => Manager[]`, like `DataProvider`.
  [Details](https://dataclient.io/blog/2026/10/03/v0.19-batch-set#test-react-0.19).

## Step 8: `__DC_CONTROLLERS__` is now `__DC__`

Skip this step if `rg -n '__DC_CONTROLLERS__' <source-root>` finds nothing. Replace `__DC_CONTROLLERS__.get(name)` with
`__DC__.controller`; with several stores, set `__DC__.store = name` first.
[Details](https://dataclient.io/blog/2026/10/03/v0.19-batch-set#dc-global).

## Step 9: verify

1. Search for `TODO(data-client)`: none should remain. Search for `instanceof Promise`, `isPromise` and `.then ===` near
   `fetchIfStale`: each one is a sync-data branch that no longer runs.
2. Run the type checker. Property reads on a `fetchIfStale()` result now fail to type-check, since it is a Promise. A
   Manager without `middleware` fails too (Step 4).
3. Run the tests. The codemod turns `spyOn(ctrl, 'fetchIfStale').mockReturnValue()` into `.mockResolvedValue()`; make
   other `fetchIfStale` mocks, such as `{ fetchIfStale: jest.fn(() => data) }`, resolve their value the same way.

## Reference

- Codemod source:
  [`packages/codemods/src/transforms/v0.19.js`](https://github.com/reactive/data-client/blob/master/packages/codemods/src/transforms/v0.19.js)
