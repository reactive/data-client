---
title: schema.Invalidate - Invalidating Entities
sidebar_label: schema.Invalidate
---

import HooksPlayground from '@site/src/components/HooksPlayground';
import { RestEndpoint } from '@data-client/rest';
import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';

# schema.Invalidate

Describes entities to be marked as [INVALID](/docs/concepts/expiry-policy#invalid). This removes items from a
collection, or [forces suspense](/docs/concepts/expiry-policy#any-endpoint-with-an-entity) for endpoints where the entity is required. 

Constructor:

- `entity` which entity to invalidate. The input is used to compute the pk() for lookup.

## Usage

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/users'}),
args: [],
response: [
    { id: '123', name: 'Jim' },
    { id: '456', name: 'Jane' },
    { id: '555', name: 'Phone' },
  ],
delay: 150,
},
{
  endpoint: new RestEndpoint({path: '/users/:id', method: 'DELETE' }),
  response({id}) {
    return {id}
  },
  delay: 150,
}
]}>

```typescript title="api/User"
import { Entity, RestEndpoint } from '@data-client/rest';

class User extends Entity {
  id = '';
  name = '';
  pk() {
    return this.id;
  }
}
export const getUsers = new RestEndpoint({
  path: '/users',
  schema: new schema.Collection([User]),
});
export const deleteUser = new RestEndpoint({
  path: '/users/:id',
  method: 'DELETE',
  schema: new schema.Invalidate(User),
});
```

```tsx title="UserPage"
import { getUsers, deleteUser } from './api/User';

function UsersPage() {
  const users = useSuspense(getUsers);
  const ctrl = useController();
  return (
    <div>
      {users.map(user => (
        <div key={user.pk()}>
          {user.name}{' '}
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => ctrl.fetch(deleteUser, { id: user.id })}
          >
            ❌
          </span>
        </div>
      ))}
    </div>
  );
}
render(<UsersPage />);
```

</HooksPlayground>

### Batch Invalidation

Here we add another endpoint for deleting many entities at a time by wrapping
`schema.Invalidate` in an array. `Data Client` can then `invalidate` every
entity from the response.

<EndpointPlayground
input="/posts"
init={
  {
    method: 'DELETE',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(['5', '13', '7']),
  }
}
status={200}
response={[{ id: '5' }, { id: '13' }, { id: '7' }]}>

```typescript title="Post" collapsed
export default class Post extends Entity {
  id = '';
  title = '';
  author = '';
  pk() {
    return this.id;
  }
}
```

```typescript title="Resource" {9}
import Post from './Post';
export const PostResource = resource({
  schema: Post,
  path: '/posts/:id',
}).extend('deleteMany', {
  path: '/posts',
  body: [] as string[],
  method: 'DELETE',
  schema: [new schema.Invalidate(Post)],
});
```

```typescript title="Request" column
import { PostResource } from './Resource';
PostResource.deleteMany(['5', '13', '7']);
```

</EndpointPlayground>

Sometimes our backend returns nothing for 'DELETE'. In this
case, we can use [process](./RestEndpoint.md#process) to build
a usable response from the argument `body`.

<EndpointPlayground
input="/posts"
init={
  {
    method: 'DELETE',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(['5', '13', '7']),
  }
}
status={204}
response={undefined}>

```typescript title="Post" collapsed
export default class Post extends Entity {
  id = '';
  title = '';
  author = '';
  pk() {
    return this.id;
  }
}
```

```typescript title="Resource" {10-13}
import Post from './Post';
export const PostResource = resource({
  schema: Post,
  path: '/posts/:id',
}).extend('deleteMany', {
  path: '/posts',
  body: [] as string[],
  method: 'DELETE',
  schema: [new schema.Invalidate(Post)],
  process(value, body) {
    // use the body payload to inform which entities to delete
    return body.map(id => ({ id }));
  }
});
```

```typescript title="Request" column
import { PostResource } from './Resource';
PostResource.deleteMany(['5', '13', '7']);
```

</EndpointPlayground>

### Impact on useSuspense()

When entities are invalidated in a result currently being presented in React, useSuspense()
will consider them invalid

- For optional Entities, they are simply removed
- For required Entities, this invalidates the entire response re-triggering suspense.
