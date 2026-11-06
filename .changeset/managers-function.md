---
'@data-client/core': minor
'@data-client/react': minor
'@data-client/vue': minor
---

BREAKING: `managers` is a function, so each store gets its own [Managers](https://dataclient.io/docs/api/Manager#lifetimes)

[DataProvider](https://dataclient.io/docs/api/DataProvider#managers), [DataClientPlugin](https://dataclient.io/docs/api/DataClientPlugin#managers) and `prepareStore()` call it once for each store, so a remounted `DataProvider` gets new Managers. Arrays are no longer accepted. Define the function at module level:

```tsx title="Before"
const managers = [new MyManager(), ...getDefaultManagers()];

<DataProvider managers={managers}>
```

```tsx title="After"
const managers = () => [new MyManager(), ...getDefaultManagers()];

<DataProvider managers={managers}>
```

`npx @data-client/codemods v0.19 src/` converts arrays, `getDefaultManagers()` and Vue's plugin options.

A Manager's code lives at one of three lifetimes:

| Lifetime | Lasts                   | Holds                                                      |
| -------- | ----------------------- | ---------------------------------------------------------- |
| Config   | the page                | options passed to the constructor, like a URL or callbacks |
| Store    | one store               | instance fields about the store, like fetches in flight    |
| Active   | `init()` to `cleanup()` | timers, connections and listeners                          |

So a constructor only stores its options. React can construct Managers for a store it then discards, so a constructor must not open anything.

[`init(state)`](https://dataclient.io/docs/api/Manager#init) now gets the store's current state, including when Managers resume after `cleanup()`. Before, it got the initial state. `initManager()` no longer takes a third argument, so custom providers drop it.

[DevToolsManager](https://dataclient.io/docs/api/DevToolsManager) connects to the Redux DevTools extension in `init()` instead of its constructor, so Managers React discards never connect. Stores mounted at the same time show under their own name in the extension, like `'Data Client: My App (2)'`.

Why: [#2791](https://github.com/reactive/data-client/pull/2791) made the default Managers one set per `DataProvider` as a first step toward multiple providers. A custom array still shared its instances, so a remounted `DataProvider` inherited state about the old store.
