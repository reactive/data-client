---
title: Computed Properties
---

[Entity](../api/Entity.md) classes are just normal classes, so any common derived data can just be added as
getters to the class itself.

```typescript
import { Entity } from '@rest-hooks/rest';

class User extends Entity {
  id = '';
  firstName = '';
  lastName = '';
  username = '';
  email = '';

  pk() {
    return this.id;
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}
```

If the computations are expensive feel free to add some
memoization.

```typescript
import { Entity } from '@rest-hooks/rest';
import { memoize } from 'lodash';

class User extends Entity {
  truelyExpensiveValue = memoize(() => {
    // compute that expensive thing!
  });
}
```
