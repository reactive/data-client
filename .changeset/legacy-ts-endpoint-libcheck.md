---
'@data-client/endpoint': patch
'@data-client/rest': patch
'@data-client/graphql': patch
---

Fix more TypeScript 4.x errors when `skipLibCheck` is off

[Entity](https://dataclient.io/rest/api/Entity), [Endpoint](https://dataclient.io/rest/api/Endpoint), [Union](https://dataclient.io/rest/api/Union) and [RestEndpoint](https://dataclient.io/rest/api/RestEndpoint) declarations no longer report errors on TypeScript 4.0 through 4.5. On TypeScript 4.0 and 4.1, an `Entity` can be an `Endpoint` schema again.

```ts
import { Endpoint, Entity, schema } from '@data-client/endpoint';

class User extends Entity {
  id = '';
  type = 'users';
}
const getUser = new Endpoint(
  (id: string) => fetch(`/users/${id}`).then(res => res.json()),
  { schema: User },
);
const feed = new schema.Union({ users: User }, 'type');

// Before (TypeScript 4.0, skipLibCheck: false):
//   error TS2456: Type alias 'RemoveArray' circularly references itself.
//   error TS2322: Type 'typeof User' is not assignable to type 'EntityInterface<any>'.
// Before (TypeScript 4.2):
//   error TS2344: Type 'TBase' does not satisfy the constraint 'new (...args: any) => any'.
// After: no errors
```
