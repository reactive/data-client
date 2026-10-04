---
'@data-client/endpoint': patch
'@data-client/rest': patch
'@data-client/graphql': patch
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix Entity classes not assignable to `EntityInterface`

[Entity.pk()](https://dataclient.io/rest/api/Entity#pk)'s static `args` parameter is now `readonly any[]`, matching `EntityInterface`. Entity classes can be passed where an `EntityInterface` is expected.

```ts
import type { EntityInterface } from '@data-client/react';

// Before: TypeScript error (args is readonly in EntityInterface)
// After: typechecks
const schema: EntityInterface = User;
```

If you override `static pk()` and annotate `args` as a mutable array, make it `readonly`:

```ts
class User extends Entity {
  static pk(value: any, parent?: any, key?: string, args?: readonly any[]) {
    return `${value.id}-${args?.[0]?.org}`;
  }
}
```
