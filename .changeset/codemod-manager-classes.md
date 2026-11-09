---
'@data-client/codemods': patch
---

Migrate custom Managers in the `v0.19` codemod

The codemod now makes each Manager change that has one right answer, and adds a `TODO(data-client)` comment wherever it
can't change the code safely, so nothing changes behavior without a mark.

- Renames `getMiddleware()` to a [`middleware`](https://dataclient.io/docs/api/Manager#middleware) property when it only returns a function, and rewrites `manager.getMiddleware()` calls. If any `getMiddleware()` in a file can't convert, such as one calling `super.getMiddleware()`, every one in that file keeps its code and gets the TODO.
- Gives a class that `implements Manager` without middleware a pass-through, since 0.19 throws on mount without one.
- Adds the `NetworkManager` and `SubscriptionManager` that `renderDataHook()` always ran before 0.19 to `managers` lists of `new` Managers that lack them, so tests keep running as before.
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
