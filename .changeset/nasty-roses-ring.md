---
'@data-client/react': patch
'@data-client/core': patch
---

Add [actionTypes](https://dataclient.io/docs/api/Actions) without \_TYPE suffix

(Not breaking - we keep the old actionTypes name as well.)

```ts title="Before"
import type { Manager, Middleware } from '@data-client/react';
import { actionTypes } from '@data-client/react';

export default class LoggingManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    switch (action.type) {
      case actionTypes.SET_RESPONSE_TYPE:
        console.info(
          `${action.endpoint.name} ${JSON.stringify(action.response)}`,
        );
      default:
        return next(action);
    }
  };

  cleanup() {}
}
```

```ts title="After"
import type { Manager, Middleware } from '@data-client/react';
import { actionTypes } from '@data-client/react';

export default class LoggingManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    switch (action.type) {
      case actionTypes.SET_RESPONSE:
        console.info(
          `${action.endpoint.name} ${JSON.stringify(action.response)}`,
        );
      default:
        return next(action);
    }
  };

  cleanup() {}
}
```
