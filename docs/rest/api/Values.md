---
title: Values Schema - Declarative map data for React
vue_title: Values Schema - Declarative map data for Vue
sidebar_label: Values
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import PolymorphicFeedDemo from '../shared/\_PolymorphicFeedDemo.mdx';
import { RestEndpoint } from '@data-client/rest';

# Values

Like [Array](./Array), `Values` are unbounded in size. The definition here describes the types of values to expect,
with keys being any string.

Describes a map whose values follow the given schema.

- `definition`: **required** A singular schema that this array contains _or_ a mapping of schema to attribute values.
- `schemaAttribute`: _optional_ (required if `definition` is not a singular schema) The attribute on each entity found that defines what schema, per the definition mapping, to use when normalizing.
  Can be a string or a function. If given a function, accepts the following arguments:
  - `value`: The input value of the entity.
  - `parent`: The parent object of the input array.
  - `key`: The key at which the input array appears on the parent object.

:::tip

Make it mutable (new items can be [assigned](./Collection.md#assign)) with [Collections](./Collection.md)

:::

## Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `Values` constructor. This method tends to be useful for creating circular references in schema.

:::info[Naming]

`Values` is named after [Object.values()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Object/values) as
its schemas are used for the value of an Object.

:::

## Usage

<FrameworkPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/items'}),
args: [],
response: { firstThing: { id: 1 }, secondThing: { id: 2 } },
delay: 150,
},
]}>

:::react

```tsx title="ItemPage.tsx"
import { Entity, RestEndpoint, Values } from '@data-client/rest';
import { useSuspense } from '@data-client/react';

export class Item extends Entity {
  id = 0;
}
export const getItems = new RestEndpoint({
  path: '/items',
  schema: new Values(Item),
});
function ItemPage() {
  const items = useSuspense(getItems);
  return <pre>{JSON.stringify(items, undefined, 2)}</pre>;
}
render(<ItemPage />);
```

:::

:::vue

```ts title="api/Item"
import { Entity, RestEndpoint, Values } from '@data-client/rest';

export class Item extends Entity {
  id = 0;
}
export const getItems = new RestEndpoint({
  path: '/items',
  schema: new Values(Item),
});
```

```html title="ItemPage.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getItems } from './api/Item';

  const items = await useSuspense(getItems);
</script>

<template>
  <pre>{{ JSON.stringify(items, undefined, 2) }}</pre>
</template>
```

:::

</FrameworkPlayground>

### Updating many entities

Use Values with [Controller.set()](/docs/api/Controller#set-array) to write many entities in one store update,
without an endpoint.

```ts
ctrl.set(getItems.schema, {
  firstThing: { id: 1 },
  secondThing: { id: 2 },
});
```

### Polymorphic types

If your input data is an object that has values of more than one type of entity, but their schema is not easily defined by the key, you can use a mapping of schema, much like [Union](./Union.md) and [schema.Array](./Array.md).

:::note

If your data returns an object that you did not provide a mapping for, the original object will be returned in the result and an entity will not be created.

:::

#### string schemaAttribute

<PolymorphicFeedDemo schema="Values" attribute="string" />

#### function schemaAttribute

The return values should match a key in the `definition`. Here we'll show the same behavior as the 'string'
case, except we'll append an 's'.

<PolymorphicFeedDemo schema="Values" attribute="function" />
