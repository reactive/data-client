---
'@data-client/core': minor
---

[Middleware](https://dataclient.io/docs/api/Manager#getmiddleware) no longer gets `controller` prop.

The entire API is controller itself:
`({controller}) => next => async action => {}` ->
`(controller) => next => async action => {}`

```ts
class LoggingManager implements Manager {
  getMiddleware = (): Middleware => controller => next => async action => {
    console.log('before', action, controller.getState());
    await next(action);
    console.log('after', action, controller.getState());
  };

  cleanup() {}
}
```

Note this has been possible for some time this simply drops
legacy compatibility.