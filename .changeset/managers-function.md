---
'@data-client/core': minor
'@data-client/react': minor
'@data-client/vue': minor
---

Give each store its own [Managers](https://dataclient.io/docs/api/Manager#lifetimes): `managers` takes a function

[DataProvider](https://dataclient.io/docs/api/DataProvider#managers) and [DataClientPlugin](https://dataclient.io/docs/api/DataClientPlugin#managers) call it once for each store, so a remounted `DataProvider` gets new Managers. Define it at module level:

```tsx title="Before"
const managers = [new MyManager(), ...getDefaultManagers()];

<DataProvider managers={managers}>
```

```tsx title="After"
const managers = () => [new MyManager(), ...getDefaultManagers()];

<DataProvider managers={managers}>
```

An array of Managers is deprecated, because every store that uses it shares the same instances. A Manager instance that moves to a second store after the first one started logs a warning in development.

A Manager's code lives at one of three lifetimes:

| Lifetime | Lasts                   | Holds                                                      |
| -------- | ----------------------- | ---------------------------------------------------------- |
| Config   | the page                | options passed to the constructor, like a URL or callbacks |
| Store    | one store               | instance fields about the store, like fetches in flight    |
| Active   | `init()` to `cleanup()` | timers, connections and listeners                          |

So a constructor only stores its options. React can construct Managers for a store it then discards, so a constructor must not open anything.

[`init(state)`](https://dataclient.io/docs/api/Manager#init) now gets the store's current state, including when Managers resume after `cleanup()`. Before, it got the initial state. `initManager()`'s third argument is ignored, so custom providers can drop it.

[DevToolsManager](https://dataclient.io/docs/api/DevToolsManager) instances with the same `name` share one browser extension connection, so a new store no longer opens another.

Why: [#2791](https://github.com/reactive/data-client/pull/2791) made the default Managers one set per `DataProvider` as a first step toward multiple providers. A custom array still shared its instances, so a remounted `DataProvider` inherited state about the old store.
