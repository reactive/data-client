---
'@data-client/codemods': patch
---

Migrate custom Managers in the `v0.19` codemod

The codemod now does the mechanical Manager changes, so fewer edits are left by hand, and marks the rest with a
`TODO(data-client)` comment.

- Renames `getMiddleware()` to a [`middleware`](https://dataclient.io/docs/api/Manager#middleware) property when it only returns a function, and rewrites `manager.getMiddleware()` calls.
- Gives a class that `implements Manager` without middleware a pass-through, since 0.19 throws on mount without one.
- Adds the `NetworkManager` and `SubscriptionManager` that `renderDataHook()` ran before 0.19 to `managers` lists that lack them.
- Converts `renderDataCompose()` `managers` arrays to functions.
- Leaves a TODO where it wraps an existing value or call as `() => managers` (stores would share those instances, and a hook can't run there), and on reads of the removed `cleanupDate`.

```ts
class LoggingManager implements Manager {
  getMiddleware(): Middleware {
    return controller => next => action => next(action);
  }
}
// becomes
class LoggingManager implements Manager {
  middleware: Middleware = controller => next => action => next(action);
}
```
