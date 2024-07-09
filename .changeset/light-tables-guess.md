---
'@data-client/core': minor
'@data-client/react': patch
'@data-client/test': patch
---

BREAKING CHANGE: remove fetchAction.payload

This only affects those writing custom [Managers](https://dataclient.io/docs/concepts/managers) that
inspect `FETCH_TYPE` `action.fetch`.

#### Before

```ts
import { FETCH_TYPE, type Manager, type Middleware } from '@data-client/react';

export default class MyManager implements Manager {
  getMiddleware = (): Middleware => controller => next => async action => {
    switch (action.type) {
      case FETCH_TYPE:
        // consume fetch, and print the resolution
        action.fetch().then(response => console.log(response));
      default:
        return next(action);
    }
  };

  cleanup() {}
}
```

#### After

```ts
import { FETCH_TYPE, type Manager, type Middleware } from '@data-client/react';

export default class MyManager implements Manager {
  getMiddleware = (): Middleware => controller => next => async action => {
    switch (action.type) {
      case FETCH_TYPE:
        // consume fetch, and print the resolution
        action
          .endpoint(...action.meta.args)
          .fetch()
          .then(response => console.log(response));
      default:
        return next(action);
    }
  };

  cleanup() {}
}
```
