---
'@data-client/endpoint': patch
'@data-client/rest': patch
'@data-client/graphql': patch
---

Fix Entity classes not assignable to `EntityInterface`

[Entity.pk()](https://dataclient.io/rest/api/Entity#pk)'s static `args` parameter is now `readonly any[]`, matching `EntityInterface`. Entity classes can be passed where an `EntityInterface` is expected.

```ts
import type { EntityInterface } from '@data-client/react';

// Before: TypeScript error (args is readonly in EntityInterface)
// After: typechecks
const schema: EntityInterface = User;
```
