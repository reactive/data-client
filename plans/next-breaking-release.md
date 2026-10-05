# Next Breaking Release TODO

Type and API cleanups deferred because they would break users or mixed package versions in a minor release. Do them in the next release that already breaks compatibility and requires matching `@data-client/*` versions, and list each in that release's blog migration guide.

## Entity `pk()` args

[#4149](https://github.com/reactive/data-client/pull/4149) made Entity classes assignable to `EntityInterface` without breaking anyone, using two compatibility shims.

- **Plain `Entity.pk` declaration**: `packages/endpoint/src/schemas/Entity.ts` declares `static pk` with method syntax (`{ pk(...): ... }['pk']`) so subclass overrides that type `args?: any[]` still compile. Replace it with a plain function type taking `args?: readonly any[]`.
  - Breaks: `static pk()` overrides that annotate `args` as a mutable array. Migration: change the annotation to `readonly any[]` (the v0.19 blog already recommends this).
- **Readonly `args` in endpoint's `EntityInterface`**: `packages/endpoint/src/interface.ts` still declares `pk(..., args: any[])`, while normalizr's `EntityInterface` takes `readonly any[]`. Make them match, or have endpoint re-export normalizr's.
  - Breaks: Entity subclasses with a mutable-`args` `static pk()` override assigned to endpoint's `EntityInterface`.

## Vue `createDataClient` export

`@data-client/vue` exports `createDataClient()` and its `ProvidedDataClient` return type, but they are `DataClientPlugin` internals (marked `@deprecated` in `packages/vue/src/providers/createDataClient.ts`). `ProvideOptions` stays public since it types the plugin options; only its `app` field is internal.

- **Stop exporting `createDataClient` and `ProvidedDataClient`** from `packages/vue/src/providers/index.ts`, drop `app` from `ProvideOptions` (pass it to `createDataClient` separately), remove the now-unused `provide()` branch for calls outside the plugin, and type `DataClientPlugin.install()` as returning `void` so `ProvidedDataClient` isn't reachable through it.
  - Decide first: that `provide()` branch is the only way to scope a separate store to a component subtree (calling `createDataClient()` in a component's `setup()` shadows the app-level store for its descendants, like nesting `DataProvider` in React). Either drop subtree scoping on purpose, or keep it as a small supported composable.
  - Breaks: code that calls `createDataClient()` directly or imports `ProvidedDataClient`. Migration: install the store with `app.use(DataClientPlugin, options)` and read the controller with `useController()`.

## Vue `waitForNextUpdate()`

`renderDataCompose()` from `@data-client/vue/test` still returns `waitForNextUpdate()`, marked `@deprecated` in `packages/vue/src/test/renderDataCompose.ts`. It resolves silently after a 1 second cap, so tests can pass while still suspended.

- **Remove `waitForNextUpdate`** from `renderDataCompose()`'s return value, along with the `resolveNextUpdate` bookkeeping in its test component.
  - Breaks: tests that destructure or call `waitForNextUpdate()`. Migration: `await result` for a Promise result; after changing props or calling the controller, `await nextTick()`, `await allSettled()`, then `await nextTick()`.
