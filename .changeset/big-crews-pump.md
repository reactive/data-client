---
'@data-client/core': minor
'@data-client/react': patch
'@data-client/test': patch
---

BREAKING CHANGE: setResponseAction.payload -> setResponseAction.response

This only affects those writing custom [Managers](https://dataclient.io/docs/concepts/managers) that
inspect `SET_RESPONSE_TYPE` `action.payload`.

#### Before

```ts
import { SET_RESPONSE_TYPE, type Manager, type Middleware } from '@data-client/react';

export default class MyManager implements Manager {
  getMiddleware = (): Middleware => controller => next => async action => {
    switch (action.type) {
      case SET_RESPONSE_TYPE:
        console.log('Resolved with value', action.payload);
        return next(action);
      default:
        return next(action);
    }
  };

  cleanup() {}
}
```

#### After

```ts
import { SET_RESPONSE_TYPE, type Manager, type Middleware } from '@data-client/react';

export default class MyManager implements Manager {
  getMiddleware = (): Middleware => controller => next => async action => {
    switch (action.type) {
      case SET_RESPONSE_TYPE:
        console.log('Resolved with value', action.response);
        return next(action);
      default:
        return next(action);
    }
  };

  cleanup() {}
}
```