---
'@data-client/core': minor
---

Add `actions` export

`actions` is a namespace for all action creators. It is typically
preferred to use [Controller's](https://dataclient.io/docs/api/Controller) type-safe dispatch methods, as
members of this namespace could have breaking changes in a minor release.

```ts
import { actions, type Manager, type Middleware } from '@data-client/core';

export default class MyManager implements Manager {
  getMiddleware = (): Middleware => controller => next => {
    const todo = { id: '5', title: 'my first todo' };

    // These do the same thing
    controller.dispatch(
      actions.createSet(Todo, { args: [{ id: todo.id }], value: todo }),
    );
    // This is simpler; type-enforced; and will only change in major versions
    controller.set(Todo, { id: todo.id }, todo);

    return async action => next(action);
  };

  cleanup() {}
}
```

BREAKING CHANGE: Removed `createFetch`, `createSet`, `createSetResponse` from export. Use action.createFetch instead.
