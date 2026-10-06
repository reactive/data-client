---
title: schema.Array - Declarative list data for React
vue_title: schema.Array - Declarative list data for Vue
sidebar_label: schema.Array
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import PolymorphicFeedDemo from '../shared/\_PolymorphicFeedDemo.mdx';
import { RestEndpoint } from '@data-client/rest';

# schema.Array

Creates a schema to normalize an array of schemas. If the input value is an [Object](./Object.md) instead of an `Array`,
the normalized result will be an `Array` of the [Object](./Object.md)'s values.

_Note: The same behavior can be defined with shorthand syntax: `[ mySchema ]`_

- `definition`: **required** A singular schema that this array contains _or_ a mapping of attribute values to schema.
- `schemaAttribute`: _optional_ (required if `definition` is not a singular schema) The attribute on each entity found that defines what schema, per the definition mapping, to use when normalizing.
  Can be a string or a function. If given a function, accepts the following arguments:
  _ `value`: The input value of the entity.
  _ `parent`: The parent object of the input array. \* `key`: The key at which the input array appears on the parent object.

:::tip

For unbounded collections with `string` keys, use [schema.Values](./Values.md)

:::

:::tip

Make it mutable (new items can be [pushed](./Collection.md#push)/[unshifted](./Collection.md#unshift)) with [Collections](./Collection.md)

:::

## Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `Array` constructor. This method tends to be useful for creating circular references in schema.

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
]}>

:::react

```tsx title="Users.tsx"
import { Entity, RestEndpoint, schema } from '@data-client/rest';
import { useSuspense } from '@data-client/react';

export class User extends Entity {
  id = '';
  name = '';
}
export const getUsers = new RestEndpoint({
  path: '/users',
  schema: new schema.Array(User),
});
function UsersPage() {
  const users = useSuspense(getUsers);
  return (
    <div>
      {users.map(user => (
        <div key={user.pk()}>{user.name}</div>
      ))}
    </div>
  );
}
render(<UsersPage />);
```

:::

:::vue

```ts title="api/User"
import { Entity, RestEndpoint, schema } from '@data-client/rest';

export class User extends Entity {
  id = '';
  name = '';
}
export const getUsers = new RestEndpoint({
  path: '/users',
  schema: new schema.Array(User),
});
```

```html title="UsersPage.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getUsers } from './api/User';

  const users = await useSuspense(getUsers);
</script>

<template>
  <div>
    <div v-for="user in users" :key="user.pk()">{{ user.name }}</div>
  </div>
</template>
```

:::

</FrameworkPlayground>

### Updating many entities

Use an Array with [Controller.set()](/docs/api/Controller#set-array) to write many entities in one store update,
without an endpoint.

```ts
ctrl.set(
  [User],
  [
    { id: '123', name: 'Jim' },
    { id: '456', name: 'Jane' },
  ],
);
```

### Polymorphic types

If your input data is an array of more than one type of entity, it is necessary to define a schema mapping.

:::note

If your data returns an object that you did not provide a mapping for, the original object will be returned in the result and an entity will not be created.

:::

#### string schemaAttribute

<PolymorphicFeedDemo schema="schema.Array" attribute="string" />

#### function schemaAttribute

The return values should match a key in the `definition`. Here we'll show the same behavior as the 'string'
case, except we'll append an 's'.

<PolymorphicFeedDemo schema="schema.Array" attribute="function" />
