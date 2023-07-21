---
title: Computed Properties
---

[Entity](../api/Entity.md) classes are just normal classes, so any common derived data can just be added as
getters to the class itself.

```typescript
import { Entity } from '@data-client/rest';

class User extends Entity {
  id = '';
  firstName = '';
  lastName = '';
  username = '';
  email = '';

  // highlight-start
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
  // highlight-end

  pk() {
    return this.id;
  }
  static key = 'User';
}
```

If the computations are expensive feel free to add some
memoization.

```typescript
import { Entity } from '@data-client/rest';
import { memoize } from 'lodash';

class User extends Entity {
  truelyExpensiveValue = memoize(() => {
    // compute that expensive thing!
  });
}
```

:::tip

If you simply want to [deserialize a field](./network-transform.md#deserializing-fields) to a more useful form like [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) or [BigNumber](https://github.com/MikeMcl/bignumber.js), you can use
the declarative [static schema](./network-transform.md#deserializing-fields).

```typescript
import { Entity } from '@data-client/rest';

class User extends Entity {
  id = '';
  firstName = '';
  lastName = '';
  createdAt = new Date(0);

  pk() {
    return this.id;
  }
  static key = 'User';

  // highlight-start
  static schema = {
    createdAt: Date,
  };
  // highlight-end
}
```

:::
