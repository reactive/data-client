---
title: All Schema - Access every entity in the Reactive Data Client store
sidebar_label: All
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import PolymorphicFeedDemo from '../shared/\_PolymorphicFeedDemo.mdx';
import { RestEndpoint } from '@data-client/rest';

# All

Retrieves all entities in cache as an Array.

- `definition`: **required** A singular [Entity](./Entity.md) that this array contains _or_ a mapping of attribute values to [Entities](./Entity.md).
- `schemaAttribute`: _optional_ (required if `definition` is not a singular schema) The attribute on each entity found that defines what schema, per the definition mapping, to use when normalizing.
  Can be a string or a function. If given a function, accepts the following arguments:
  _ `value`: The input value of the entity.
  _ `parent`: The parent object of the input array. \* `key`: The key at which the input array appears on the parent object.

## Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `All` constructor. This method tends to be useful for creating circular references in schema.

## Usage

To describe a simple array of a singular entity type:

<FrameworkPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/users'}),
args: [],
response: [
{ id: '123', name: 'Jim' },
{ id: '456', name: 'Jane' },
],
delay: 150,
},
{
endpoint: new RestEndpoint({path: '/users', method:'POST'}),
args: [{ name: 'ABC' }],
response: { id: '777', name: 'ABC' },
delay: 150,
},
]}>

```tsx title="api/User" collapsed
import { Entity, RestEndpoint } from '@data-client/rest';

export class User extends Entity {
  id = '';
  name = '';
}
export const createUser = new RestEndpoint({
  path: '/users',
  schema: User,
  body: { name: '' },
  method: 'POST'
});
```

:::react

```tsx title="NewUser" collapsed
import React from 'react';
import { useController } from '@data-client/react';
import { createUser } from './api/User';

export default function NewUser() {
  const ctrl = useController();
  const handlePress = React.useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        ctrl.fetch(createUser, {name: e.currentTarget.value});
        e.currentTarget.value = '';
      }
    },
    [ctrl],
  );
  return <input onKeyPress={handlePress}/>;
}
```

```tsx title="UsersPage.tsx"
import { RestEndpoint, All } from '@data-client/rest';
import { useSuspense } from '@data-client/react';
import { User } from './api/User';
import NewUser from './NewUser';

const getUsers = new RestEndpoint({
  path: '/users',
  schema: new All(User),
});

function UsersPage() {
  const users = useSuspense(getUsers);
  return (
    <div>
      {users.map(user => (
        <div key={user.pk()}>{user.name}</div>
      ))}
      <NewUser />
    </div>
  );
}
render(<UsersPage />);
```

:::

:::vue

```html title="NewUser.vue" collapsed
<script setup lang="ts">
  import { ref } from 'vue';
  import { useController } from '@data-client/vue';
  import { createUser } from './api/User';

  const ctrl = useController();
  const name = ref('');

  const handleEnter = () => {
    ctrl.fetch(createUser, { name: name.value });
    name.value = '';
  };
</script>

<template>
  <input v-model="name" @keyup.enter="handleEnter" />
</template>
```

```html title="UsersPage.vue"
<script lang="ts">
  import { RestEndpoint, All } from '@data-client/rest';
  import { User } from './api/User';

  const getUsers = new RestEndpoint({
    path: '/users',
    schema: new All(User),
  });
</script>

<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import NewUser from './NewUser.vue';

  const users = await useSuspense(getUsers);
</script>

<template>
  <div>
    <div v-for="user in users" :key="user.pk()">{{ user.name }}</div>
    <NewUser />
  </div>
</template>
```

:::

</FrameworkPlayground>

### Polymorphic types

If your input data is an array of more than one type of entity, it is necessary to define a schema mapping.

:::note

If your data returns an object that you did not provide a mapping for, the original object will be returned in the result and an entity will not be created.

:::

#### string schemaAttribute

<PolymorphicFeedDemo schema="All" attribute="string" />

#### function schemaAttribute

The return values should match a key in the `definition`. Here we'll show the same behavior as the 'string'
case, except we'll append an 's'.

<PolymorphicFeedDemo schema="All" attribute="function" />
