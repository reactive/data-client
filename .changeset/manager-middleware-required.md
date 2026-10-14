---
'@data-client/core': minor
'@data-client/react': minor
'@data-client/vue': minor
---

BREAKING: [Manager.middleware](https://dataclient.io/docs/api/Manager#middleware) is required; `getMiddleware()` is removed

A Manager without `middleware`, including one that still uses `getMiddleware()` (replaced in v0.14), is now a
TypeScript error, and throws in development when `DataProvider` or `DataClientPlugin` mounts. Rename `getMiddleware()`
to a `middleware` property:

```ts
// before
getMiddleware = (): Middleware => controller => next => async action => next(action);
// after
middleware: Middleware = controller => next => async action => next(action);
```
