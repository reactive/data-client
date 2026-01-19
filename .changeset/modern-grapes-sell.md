---
"@data-client/core": patch
"@data-client/endpoint": patch
"@data-client/graphql": patch
"@data-client/react": patch
"@data-client/rest": patch
"@data-client/vue": patch
---

Add direct exports for schema classes from `@data-client/endpoint`

Schema classes (`Union`, `Invalidate`, `Collection`, `Query`, `Values`, `All`) can now be imported directly instead of requiring the `schema` namespace.

#### Before
```ts
import { schema } from '@data-client/endpoint';
const myUnion = new schema.Union({ users: User, groups: Group }, 'type');
```

#### After
```ts
import { Union } from '@data-client/endpoint';
const myUnion = new Union({ users: User, groups: Group }, 'type');
```

The `schema` namespace export remains available for backward compatibility.
