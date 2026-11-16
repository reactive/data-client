---
name: data-client-v0.19-migration
description: Upgrade apps that already use @data-client to v0.19. Runs the v0.19 codemod, then fixes what it flags and what it can't see. Use when bumping @data-client packages to 0.19, or when Controller.fetchIfStale(), custom Managers or the managers prop break after upgrading. Not for adopting Data Client for the first time.
---

# @data-client v0.19 Migration

Every breaking change, with Before/After code:
[v0.19 migration guide](https://dataclient.io/blog/2026/11/17/v0.19-batch-set#migration-guide).

## Step 1: bump and run the codemod

Bump the app's `@data-client/*` dependencies to `^0.19.0` together.

- `@data-client/test` now requires `@data-client/react` 0.19; `typescript` must be 4.0 or later, and `vue` 3.4 or later.
- React Native: tests with `@data-client/test` need `@testing-library/react-native`. Apps now load the native build, so
  with React Navigation, stale data refetches on screen focus.
- `@data-client/ssr` has no 0.19 release; if it's installed, read Step 4 first.
- If the repo links skills with `data-client-skills`, run `npx --no data-client-skills --upgrade` after the bump so the
  linked skills match 0.19 (Step 12 unlinks the migration skills).

Commit first so you can review the diff, then point the codemod at your source roots, not the repo root (it skips only
`node_modules`). Also pass any folder of debugging or end-to-end scripts that reads `__DC_CONTROLLERS__`
(`rg -l '__DC_CONTROLLERS__' .`); the codemod migrates those files even without an `@data-client/*` import:

```bash
npx @data-client/codemods v0.19 <source-root> --deprecations=false
```

`0 errors, N unmodified` is a clean run, not a failure. The codemod parses JavaScript and TypeScript only, and skips
files without an `@data-client/*` import (except to migrate `__DC_CONTROLLERS__`); the searches below find what it
skipped, including `.vue` and other single-file components.

## Step 2: `Controller.fetchIfStale()` always returns a Promise

It used to return the data synchronously when fresh. Now it always returns a Promise, and a call you don't await never
rejects unhandled: the error is stored for components, like any fetch error.
[Details](https://dataclient.io/blog/2026/11/17/v0.19-batch-set#fetch-if-stale-promise).

Skip this step if `rg -n 'fetchIfStale' <source-root>` finds nothing.

Where an `instanceof Promise` or `isPromise()` check had a branch that awaited the result and read the data (or the
other branch was empty), the codemod already kept that branch and deleted the other. What's left:

- **Fix each `TODO(data-client): fetchIfStale() always returns a Promise` comment.** The code below it reads the result
  as data (a check whose Promise branch did nothing, a field, destructuring, an `if`). `await` the call where the data
  is needed, delete the branch that handled synchronous data, then delete the comment.
- **Fix each `TODO(data-client): an awaited fetchIfStale() rejects` comment.** Awaited calls now reject when the latest
  fetch failed within errorExpiryLength; they used to resolve `undefined`. Move the fallback below the comment
  (`?? fallback`, `if (!data)`) into a `.catch()` or `try`/`catch` around the call when it was meant for failures. Other
  awaited calls are fine as they are: a router shows its error UI.
- **Check every other `fetchIfStale(` call for reads the codemod can't follow**: results passed to a function, stored
  on an object or class field, or in files and components it skipped. A sync-data branch behind such a check now never
  runs, and nothing fails to type-check. To check freshness without fetching, use
  `ctrl.getResponse(endpoint, ...args, ctrl.getState())`.
- **A `.then()` chain or an `async` function around an unawaited call** makes a new Promise that can reject, so end
  the chain in `.catch()`, or catch inside the function. A bare unawaited call needs none.
- **Controller subclasses** that override `fetchIfStale()` must return a Promise.

```ts
// Before
const issue = ctrl.fetchIfStale(IssueResource.get, { id });
if (!(issue instanceof Promise)) render(issue);
// After
const issue = await ctrl.fetchIfStale(IssueResource.get, { id });
render(issue);
```

## Step 3: unawaited reads never reject unhandled

`ctrl.fetch()` of an endpoint without `sideEffect` (a GET or other read) is now safe to call without awaiting, like
`fetchIfStale()`: the error is stored for components reading that endpoint. Mutations still reject unhandled, and
`await` or `.catch()` still get the error, so no code breaks.
[Details](https://dataclient.io/docs/api/Controller#fetch).

- **Error monitoring**: failures of unawaited reads (`fetch()` or `fetchIfStale()`) no longer reach global
  unhandled-rejection handlers (Sentry and similar). If the app uses an error tracker, say so in your summary and
  suggest the [error reporting Manager](https://dataclient.io/docs/concepts/managers#error-reporting). Don't add it
  unasked: it reports every failed fetch, not only these.
- **No-op catches**: the codemod deleted `.catch(() => {})` on unawaited `fetchIfStale()` and on unawaited `fetch()` of
  a resource's `get`, `getList` or `getList.getPage`. Other no-op catches are harmless, so leave them.
- **A read no component renders** (a "load more" `getPage`, a refresh of an off-screen list) now fails silently:
  wrap it in `useLoading()` so its error shows.

## Step 4: Next.js Pages Router is not supported

Skip this step unless the app uses `@data-client/ssr` (`DataClientDocument`, `AppDataProvider` in `pages/_document` or
`pages/_app`). It stops at `@data-client/react` 0.14, and 0.19 supports only the App Router: render `DataProvider` from
`@data-client/react/nextjs` in `app/layout.tsx`, then uninstall `@data-client/ssr` (and `@data-client/redux` if nothing
else uses it). Moving pages to the App Router is a routing migration, so confirm with the owner before starting it.
[Details](https://dataclient.io/blog/2026/11/17/v0.19-batch-set#nextjs-pages-router).

## Step 5: custom Managers

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
- **Managers that call `controller.resolve()`** pass the `meta.fetchedAt` of the fetch action they resolve: 0.19
  matches responses to fetches by it, after `resetEntireStore()` and against newer fetches. The codemod did this where
  the endpoint was `action.endpoint` under an `actionTypes.FETCH` check; fix each other `fetchedAt: Date.now()` that
  resolves a fetch action.

Details: [middleware](https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-middleware),
[cleanup](https://dataclient.io/blog/2026/11/17/v0.19-batch-set#manager-cleanup),
[managers function](https://dataclient.io/blog/2026/11/17/v0.19-batch-set#managers-function).

## Step 6: test helpers

- **[renderDataHook()](https://dataclient.io/docs/api/renderDataHook) now runs its `managers`**; before, it ignored
  them. The list replaces the defaults, so it needs a `NetworkManager`, plus a `SubscriptionManager` if the hook polls
  (the codemod adds both to lists of `new` calls), and the test's Managers now act on its actions.
- **A custom Provider passed to [makeRenderDataHook()](https://dataclient.io/docs/api/makeRenderDataHook)** must accept
  `managers: () => Manager[]`, like `DataProvider`.
  [Details](https://dataclient.io/blog/2026/11/17/v0.19-batch-set#test-react-0.19).

## Step 7: Vue

Skip this step unless the app uses `@data-client/vue`.

- **`DataClientPlugin` garbage-collects unused data by default.** Code that reads `useCache()` after long idle can get
  `undefined`; pass a custom `gcPolicy` only if the app needs data kept longer.
- **`useFetch()` is typed as a `Ref`**: `promise.resolved` becomes `promise.value.resolved`.

## Step 8: `__DC_CONTROLLERS__` is now `__DC__`

The codemod rewrote `__DC_CONTROLLERS__.get(name)` to `__DC__.store = name` and `__DC__.controller` in the files it
processed. Skip this step if `rg -n '__DC_CONTROLLERS__' .` finds nothing. What's left is in strings (such as
`page.evaluate('...')`), HTML, files the codemod didn't process, and code it marked: reads of the first controller, and
code that handled a missing store. Read `__DC__.controller`, after setting `__DC__.store = name` when the page has
several stores. It throws when the store isn't mounted, where `.get(name)` returned `undefined`, so check
`__DC__.stores.includes(name)` first where the store may be missing.
[Details](https://dataclient.io/blog/2026/11/17/v0.19-batch-set#dc-global).

## Step 9: verify

1. Search for `TODO(data-client)`: none should remain. Search for
   `rg -n '=> \w*[mM]anagers\b|getMiddleware|cleanupDate|__DC_CONTROLLERS__'` and fix what's left. Search for
   `instanceof Promise`, `isPromise` and `.then ===` near `fetchIfStale`: each one is a sync-data branch that no longer
   runs.
2. Run the type checker. Property reads on a `fetchIfStale()` result now fail to type-check, since it is a Promise. A
   Manager without `middleware` fails too (Step 5). Schemas now type more calls; fix the value or param name instead of
   casting, since the old code wrote data its schema doesn't describe, or widen the Entity's field types if the data
   really takes that shape:
   - `ctrl.set()` values, including `ctrl.set(getList.schema.push, args, rows)`
   - `process(value, params)` params, which can be `undefined`: read `params?.page`
   - `getOptimisticResponse()` return values
3. Run the tests. The codemod made `spyOn(ctrl, 'fetchIfStale')` and `fetchIfStale: jest.fn()` mocks resolve their
   value; make any other `fetchIfStale` mock, such as a hand-written fake Controller, return a Promise too. Some
   assertions now fail by design; update them:
   - `useLoading()` no longer keeps an old error.
   - A fixture whose request is aborted now rejects with an `AbortError`.
   - A suspended `renderDataHook()` now runs its Managers' `init()`.
   - After `DataProvider` unmounts (React 18+), `set()`, `setResponse()`, `resetEntireStore()` and `fetch()` of an
     endpoint without `sideEffect` never resolve; don't `await` them there.
   - A `DELETE` endpoint that declares `body` now sends its last argument as the body, not url params. If callers pass
     no body, remove `body` from the endpoint.

## Step 10: deprecated APIs (own commit)

They still work, but a later release removes them, so do this step unless the user opts out. Ask first when the user
can answer mid-task; otherwise go ahead. Commit Steps 1-9 first and make this its own commit, so it reverts alone; if
the user makes the commits, list the files this step changed instead.

```bash
npx @data-client/codemods v0.19 <source-root> --deprecations=only
```

It renames what has a replacement that does the same thing: `resource().create` to `getList.push` (the same request)
where it runs, for resources declared in the file or imported from a relative path or tsconfig `paths` alias; Vue
`waitForNextUpdate()` to `allSettled()`; DevTools `actionsBlacklist`/`actionsWhitelist` to
`actionsDenylist`/`actionsAllowlist`; and `static pk()` `args` to `readonly any[]`. It leaves a `TODO(data-client)`
comment naming the replacement on the rest. Fix each, then delete the comment, and repeat Step 9. Gotchas:

- `*Resource.create` it didn't rename (imported from a package, or built with something other than `resource()` from
  `@data-client/rest`): if the resource's `extend()` replaces `create` or `getList`, check that the call keeps its path
  and options.
- Code that compares endpoints, like `action.endpoint === XResource.create`, compares `name`s instead:
  `action.endpoint.name === XResource.getList.push.name`. Each read of `getList.push` makes a new endpoint, so `===`
  never matches it. Files the codemod processed carry a TODO there; also check `rg -n '\.create\b' <source-root>` for
  `.vue` and other files it skipped, and for resources not named `*Resource`.
- The endpoint's `name` changes from `Post.create` to `Post.getList.create`. Update code that matches the name as a
  string, such as Managers that log or time requests by name: `rg -n "\.create['\"\`]" <source-root>`.

Then fix what's left of `rg -n 'waitForNextUpdate|createDataClient|actions(Black|White)list' <source-root>`. The blog's
[future releases](https://dataclient.io/blog/2026/11/17/v0.19-batch-set#future-releases) lists changes that will break
later.

## Step 11: adopt 0.19 features (optional, own commit)

Nothing here is needed to upgrade: it simplifies code and speeds up store writes with features new in 0.19. Skip it
when the user asked for only what the upgrade needs. Ask first when the user can answer mid-task. Otherwise run the
codemod part, and list the judgment calls below in your summary instead of making them. Commit Steps 1-10 first and
make this its own commit; if the user makes the commits, list the files this step changed instead.

```bash
npx @data-client/codemods v0.19 <source-root> --improvements=only
```

It rewrites only code it can prove does the same thing:

- A loop (`for...of`, `forEach()`, or `await Promise.all(rows.map())`) that calls `set()` once per row becomes one
  [batch set()](https://dataclient.io/blog/2026/11/17/v0.19-batch-set#batch-set): `ctrl.set([Ticker], rows)`, or
  `ctrl.set(R.getList.schema.push, args, rows)`. Only when `rows` is an array and the Entity's `pk()` and `process()`
  read only the row. Each batch dispatches one SET action whose `action.schema` is the Array (`[Ticker]`), so check
  Managers and middleware that match SET actions by schema: match `action.schema[0]` too.
- `ctrl.set([new Invalidate(Todo)], [{ id }])` becomes `ctrl.set(new Invalidate(Todo), { id })`.
- Vue: `DataClientPlugin`'s `gcPolicy: new GCPolicy()` (now the default) is dropped, `GCPolicy` is imported from
  `@data-client/vue`, and `computed(() => args)` passed to a composable becomes the getter `() => args`.
- `|| typeof data === 'symbol'` guards on React `useCache()` and `useDLE()` data are dropped.

Then, by judgment:

- **Batch the `set()` loops it left** (`rg -n -B3 '\.set\(' <source-root>` near `for`, `forEach`, `map`): mixed Entity
  types take a `Union`, deletes a `[new Invalidate(E)]`, rows keyed by id a `Values`, and a loop with an `if` a
  `.filter()` first. Keep a loop whose Entity reads `args` or `parent` in `pk()` or `process()`, and `unshift`
  (a list goes in as given, one per row reverses it). A Manager that calls `set()` per message buffers messages and
  flushes them with one `set()` (skill "data-client-manager", batching). Batch `ctrl.fetch(getList.push, row)` loops
  into one array `push` only when the API accepts an array body, since it sends one request instead of N.
- **Remove casts 0.19 types made unnecessary**, then type-check; a cast whose removal fails reveals a value its schema
  doesn't describe, so fix the value instead: `as any` on `set()` args or values, `push`/`unshift`/`remove` bodies
  (also on Collections in a `Query` or `Lazy`), union `body` values, `FormData`, `getOptimisticResponse()` returns, a
  `Controller` subclass passed to `DataProvider`, `prepareStore()`'s store, `action.meta.promise`; and
  `as unknown as T[]` on `fetch(getList.push, list)` results. Type `process(value, params)` params from the endpoint by
  removing `params: any`.
- **Vue**: `computed()` stored in a variable only to make composable args reactive can become a getter. Delete a Vitest
  `server.deps.inline` entry for `@data-client` added to fix `useEnhancedReducer is not a function`.
- **Cancellation**: a custom `Endpoint` that wraps an SDK call can pass `this.signal` on to it, without declaring
  `this`.

## Step 12: unlink the migration skills

Whether or not you did Steps 10 and 11: if you ran `data-client-skills --upgrade` in Step 1, run
`npx --no data-client-skills` to unlink the migration skills. Not before: it removes this skill.

## Reference

- Codemod source:
  [`packages/codemods/src/transforms/v0.19.js`](https://github.com/reactive/data-client/blob/master/packages/codemods/src/transforms/v0.19.js)
