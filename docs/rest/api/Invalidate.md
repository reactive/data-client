---
title: Invalidate Schema - Invalidating Entities
sidebar_label: Invalidate
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { RestEndpoint } from '@data-client/rest';
import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';
import {
  deleteManyFixtures,
  deleteManyEmptyFixtures,
} from '@site/src/fixtures/bulk-delete-posts';

# Invalidate

Describes entities to be marked as [INVALID](/docs/concepts/expiry-policy#invalid). This removes items from a
collection, or [forces suspense](/docs/concepts/expiry-policy#invalidate-entity) for endpoints where the entity is required. 

## Constructor

```typescript
new Invalidate(entity)
new Invalidate(union)
new Invalidate(entityMap, schemaAttribute)
```

- `entity`: A singular [Entity](./Entity.md) to invalidate.
- `union`: A [Union](./Union.md) schema for polymorphic invalidation.
- `entityMap`: A mapping of schema keys to [Entities](./Entity.md).
- `schemaAttribute`: _optional_ (required if `entityMap` is used) The attribute on each entity found that defines what schema, per the entityMap, to use when normalizing.
  Can be a string or a function. If given a function, accepts the following arguments:
  - `value`: The input value of the entity.
  - `parent`: The parent object of the input array.
  - `key`: The key at which the input array appears on the parent object.

## Usage

<FrameworkPlayground groupId="schema" defaultOpen="y" fixtures={[
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
import { Entity, RestEndpoint, Collection, Invalidate } from '@data-client/rest';

class User extends Entity {
  id = '';
  name = '';
}
export const getUsers = new RestEndpoint({
  path: '/users',
  schema: new Collection([User]),
});
export const deleteUser = new RestEndpoint({
  path: '/users/:id',
  method: 'DELETE',
  schema: new Invalidate(User),
});
```

:::react

```tsx title="UserPage"
import { useSuspense, useController } from '@data-client/react';
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

:::

:::vue

```html title="UsersPage.vue"
<script setup lang="ts">
  import { useSuspense, useController } from '@data-client/vue';
  import { getUsers, deleteUser } from './api/User';

  const users = await useSuspense(getUsers);
  const ctrl = useController();
</script>

<template>
  <div>
    <div v-for="user in users" :key="user.pk()">
      {{ user.name }}
      <span
        style="cursor: pointer"
        @click="ctrl.fetch(deleteUser, { id: user.id })"
      >
        ❌
      </span>
    </div>
  </div>
</template>
```

:::

</FrameworkPlayground>

### Batch Invalidation

Here we add another endpoint for deleting many entities at a time by wrapping
`Invalidate` in an array. `Data Client` can then `invalidate` every
entity from the response.

<EndpointPlayground fixtures={deleteManyFixtures}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  author = '';
}
```

```typescript title="Resource" {9-10,13-15}
import { resource, Invalidate } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/posts/:id',
}).extend('deleteMany', {
  path: '/posts',
  searchParams: {} as { ids: string[] },
  body: undefined,
  method: 'DELETE',
  schema: [new Invalidate(Post)],
  searchToString({ ids }) {
    return `ids=${ids.join(',')}`;
  },
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.deleteMany({ ids: ['5', '13', '7'] });
```

</EndpointPlayground>

Sometimes our backend returns nothing for 'DELETE'. In this
case, we can use [process](./RestEndpoint.md#process) to build
a usable response from the `ids` sent.

<EndpointPlayground fixtures={deleteManyEmptyFixtures}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  author = '';
}
```

```typescript title="Resource" {9-10,13-19}
import { resource, Invalidate } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/posts/:id',
}).extend('deleteMany', {
  path: '/posts',
  searchParams: {} as { ids: string[] },
  body: undefined,
  method: 'DELETE',
  schema: [new Invalidate(Post)],
  searchToString({ ids }) {
    return `ids=${ids.join(',')}`;
  },
  process(value, { ids }) {
    // use the ids sent to inform which entities to delete
    return ids.map(id => ({ id }));
  },
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.deleteMany({ ids: ['5', '13', '7'] });
```

</EndpointPlayground>

To delete many entities without an endpoint, such as from a websocket message, pass the same schema to
[Controller.set()](/docs/api/Controller#set-array):

```ts
ctrl.set([new Invalidate(Post)], [{ id: '5' }, { id: '13' }, { id: '7' }]);
```

Or delete a single entity:

```ts
ctrl.set(new Invalidate(Post), { id: '5' });
```

### Polymorphic types

If your endpoint can delete more than one type of entity, you can use polymorphic invalidation.

#### With Union schema

The simplest approach is to pass an existing [Union](./Union.md) schema directly:

```typescript
import { Entity, RestEndpoint, Union, Invalidate } from '@data-client/rest';

class User extends Entity {
  id = '';
  name = '';
  readonly type = 'users';
}
class Group extends Entity {
  id = '';
  groupname = '';
  readonly type = 'groups';
}

const MemberUnion = new Union(
  { users: User, groups: Group },
  'type'
);

const deleteMember = new RestEndpoint({
  path: '/members/:id',
  method: 'DELETE',
  schema: new Invalidate(MemberUnion),
});
```

#### string schemaAttribute

Alternatively, define the polymorphic mapping inline with a string attribute:

```typescript
import { RestEndpoint, Invalidate } from '@data-client/rest';

const deleteMember = new RestEndpoint({
  path: '/members/:id',
  method: 'DELETE',
  schema: new Invalidate(
    { users: User, groups: Group },
    'type'
  ),
});
```

#### function schemaAttribute

The return values should match a key in the entity map. This is useful for more complex discrimination logic:

```typescript
import { RestEndpoint, Invalidate } from '@data-client/rest';

const deleteMember = new RestEndpoint({
  path: '/members/:id',
  method: 'DELETE',
  schema: new Invalidate(
    { users: User, groups: Group },
    (input, parent, key) => input.memberType === 'user' ? 'users' : 'groups'
  ),
});
```

### Impact on useSuspense()

When entities are invalidated in a result currently being presented in :react[React]:vue[Vue], useSuspense()
will consider them invalid

- For optional Entities, they are simply removed
- For required Entities, this invalidates the entire response re-triggering suspense.
