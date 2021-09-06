---
title: Computed Properties
id: computed-properties
original_id: computed-properties
---
`Resource` classes are just normal classes, so any common derived data can just be added as
getters to the class itself.

```typescript
import { Resource } from 'rest-hooks';

class User extends Resource {
  readonly id: number | undefined = undefined;
  readonly firstName: string = '';
  readonly lastName: string = '';
  readonly username: string = '';
  readonly email: string = '';

  pk() {
    return this.id?.toString();
  }

  static urlRoot = '/users/';

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}
```

If the computations are expensive feel free to add some
memoization.

```typescript
import { Resource } from 'rest-hooks';
import { memoize } from 'lodash';

class User extends Resource {
  truelyExpensiveValue = memoize(() => {
    // compute that expensive thing!
  });
}
```
