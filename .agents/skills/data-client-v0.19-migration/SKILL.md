---
name: data-client-v0.19-migration
description: Upgrade apps that already use @data-client to v0.19. Runs the v0.19 codemod, then fixes what it flags and what it can't see. Use when bumping @data-client packages to 0.19, or when Controller.fetchIfStale(), custom Managers or the managers prop break after upgrading. Not for adopting Data Client for the first time.
---

# @data-client v0.19 Migration

Every breaking change, with Before/After code:
[v0.19 migration guide](https://dataclient.io/blog/2026/10/03/v0.19-batch-set#migration-guide).

## Step 1: bump and run the codemod

Bump the app's `@data-client/*` dependencies to `^0.19.0` together.

- `@data-client/test` now requires `@data-client/react` 0.19; `typescript` must be 4.0 or later, and `vue` 3.4 or later.
- React Native: tests with `@data-client/test` need `@testing-library/react-native`. Apps now load the native build, so
  with React Navigation, stale data refetches on screen focus.
- `@data-client/ssr` has no 0.19 release; if it's installed, read Step 3 first.
- If the repo links skills with `data-client-skills`, run `npx --no data-client-skills --upgrade` after the bump so the
  linked skills match 0.19 (Step 9 unlinks the migration skills at the end).

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
  `ctrl.getResponse(endpoint, ...args, ctrl.getState())`.
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

## Step 4: custom Managers

Skip this step if
`rg -n 'managers|implements Manager|extends \w*Manager|: Manager\b|getMiddleware|cleanupDate' <source-root>` finds
nothing. Otherwise bring each custom Manager to the 0.19 lifecycle in skill "data-client-manager" (the current copy
ships at `node_modules/@data-client/core/skills/data-client-manager/SKILL.md`; one linked into the project may be older):
`cleanup()` pauses without ending the store, and each store gets new Managers. The codemod renamed `getMiddleware()`
where it only returned a function, and gave Managers without middleware a pass-through. What's left:

- **Fix each `TODO(data-client)` comment** about `getMiddleware()`, `managers` or `cleanupDate`, then delete it:
  - `getMiddleware()` that does work first: move the work into `init()`, and define a `middleware` property.
  - `super.getMiddleware()`: `super` can't reach the parent's property, and a redeclared field can't read it (TS2729).
    Wrap it in the constructor instead, without redeclaring the field:
    `constructor() { super(); const parent = this.middleware; this.middleware = controller => ... }`.
  - `() => managers` around an array built elsewhere: it still shares those instances between stores. Make the array's
    definition the function, so each `new` runs per store, and pass that function.
  - `cleanupDate`: it's removed; delete the code that reads or sets it.
- **Move setup out of the constructor and `middleware` into `init()`**: StrictMode and `<Activity>` call `cleanup()`
  and later `init()` on the same store. Save the controller in `middleware` (`this.controller = controller`) for
  `init()` to use. Stop resetting store state in `cleanup()`, and guard middleware side effects with a field `cleanup()`
  clears (`this.socket?.send()`), since actions can still arrive after it.
- **Arrays in files without an `@data-client/*` import** aren't converted, and throw a `managers is not a function`
  TypeError on mount.
- **Managers that call `controller.resolve()`** pass the `action.meta.fetchedAt` of the fetch they resolve, not
  `Date.now()`: 0.19 matches responses to fetches by it, after `resetEntireStore()` and against newer fetches.

Details: [middleware](https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-middleware),
[cleanup](https://dataclient.io/blog/2026/10/03/v0.19-batch-set#manager-cleanup),
[managers function](https://dataclient.io/blog/2026/10/03/v0.19-batch-set#managers-function).

## Step 5: test helpers

- **[renderDataHook()](https://dataclient.io/docs/api/renderDataHook) now runs its `managers`**; before, it ignored
  them. The list replaces the defaults, so it needs a `NetworkManager`, plus a `SubscriptionManager` if the hook polls
  (the codemod adds both to lists of `new` calls), and the test's Managers now act on its actions.
- **A custom Provider passed to [makeRenderDataHook()](https://dataclient.io/docs/api/makeRenderDataHook)** must accept
  `managers: () => Manager[]`, like `DataProvider`.
  [Details](https://dataclient.io/blog/2026/10/03/v0.19-batch-set#test-react-0.19).

## Step 6: Vue

Skip this step unless the app uses `@data-client/vue`.

- **`DataClientPlugin` garbage-collects unused data by default.** Code that reads `useCache()` after long idle can get
  `undefined`; pass a custom `gcPolicy` only if the app needs data kept longer.
- **`useFetch()` is typed as a `Ref`**: `promise.resolved` becomes `promise.value.resolved`.

## Step 7: `__DC_CONTROLLERS__` is now `__DC__`

Debug scripts often live outside the source roots, so search the repo: skip this step if
`rg -n '__DC_CONTROLLERS__' .` finds nothing. Replace `__DC_CONTROLLERS__.get(name)` with `__DC__.controller`; with
several stores, set `__DC__.store = name` first.
[Details](https://dataclient.io/blog/2026/10/03/v0.19-batch-set#dc-global).

## Step 8: deprecated APIs

They still work, but a later release removes them. The codemod renamed what has an equivalent (`Resource.create` to
`Resource.getList.push` for a `resource()` in the same file; DevTools `actionsBlacklist`/`actionsWhitelist`) and left a
`TODO(data-client)` comment naming the replacement on the rest. Fix each, then delete the comment. Gotchas:

- `*Resource.create` from another file, or whose `extend()` replaces `create` or `getList`: if `extend()` replaces
  either, check that the call keeps its path and options before switching to `getList.push`. Resources not named
  `*Resource` get no TODO, so also check `rg -n '\.create\b' <source-root>`.
- `waitForNextUpdate()` in `renderDataCompose()` tests: `await result` for the first load, `await allSettled()` after
  changing props or calling the controller.

## Step 9: verify

1. Search for `TODO(data-client)`: none should remain. Search for
   `rg -n '=> \w*[mM]anagers\b|getMiddleware|cleanupDate|__DC_CONTROLLERS__|waitForNextUpdate|createDataClient|actions(Black|White)list'` and fix what's left. Search for
   `instanceof Promise`, `isPromise` and `.then ===` near `fetchIfStale`: each one is a sync-data branch that no longer
   runs.
2. Run the type checker. Property reads on a `fetchIfStale()` result now fail to type-check, since it is a Promise. A
   Manager without `middleware` fails too (Step 4). Schemas now type more calls; fix the value or param name instead of
   casting, since the old code wrote data its schema doesn't describe, or widen the Entity's field types if the data
   really takes that shape:
   - `ctrl.set()` values, including `ctrl.set(getList.schema.push, args, rows)`
   - `process(value, params)` params, which can be `undefined`: read `params?.page`
   - `getOptimisticResponse()` return values
3. Run the tests. The codemod turns `spyOn(ctrl, 'fetchIfStale').mockReturnValue()` into `.mockResolvedValue()`; make
   other `fetchIfStale` mocks, such as `{ fetchIfStale: jest.fn(() => data) }`, resolve their value the same way. Some
   assertions now fail by design; update them:
   - `useLoading()` no longer keeps an old error.
   - A fixture whose request is aborted now rejects with an `AbortError`.
   - A suspended `renderDataHook()` now runs its Managers' `init()`.
   - After `DataProvider` unmounts (React 18+), `set()`, `setResponse()`, `resetEntireStore()` and `fetch()` of an
     endpoint without `sideEffect` never resolve; don't `await` them there.
   - A `DELETE` endpoint that declares `body` now sends its last argument as the body, not url params. If callers pass
     no body, remove `body` from the endpoint.
4. If you ran `data-client-skills --upgrade` in Step 1, run `npx --no data-client-skills` last, to unlink the migration
   skills. Not before: it removes this skill.

Optional, same PR: the blog's [future releases](https://dataclient.io/blog/2026/10/03/v0.19-batch-set#future-releases)
lists changes that will break later.

## Reference

- Codemod source:
  [`packages/codemods/src/transforms/v0.19.js`](https://github.com/reactive/data-client/blob/master/packages/codemods/src/transforms/v0.19.js)
