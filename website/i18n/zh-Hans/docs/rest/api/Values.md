---
title: Values Schema - React 中的声明式 map 数据
vue_title: Values Schema - Vue 中的声明式 map 数据
sidebar_label: Values
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import PolymorphicFeedDemo from '../shared/\_PolymorphicFeedDemo.mdx';
import { RestEndpoint } from '@data-client/rest';

# Values

与 [Array](./Array) 一样，`Values` 的大小没有上限。这里的 definition 描述了预期的值类型，
键可以是任意字符串。

描述一个其值遵循给定 schema 的 map。

- `definition`：**必需** 该数组所包含的单一 schema，*或者* 一个从属性值到 schema 的映射。
- `schemaAttribute`：*可选*（当 `definition` 不是单一 schema 时必需）每个 entity 上的一个属性，根据 definition 映射决定规范化时使用哪个 schema。
  可以是字符串或函数。如果是函数，它接受以下参数：
  - `value`：entity 的输入值。
  - `parent`：输入数组的父对象。
  - `key`：输入数组在父对象上所处的键。

:::tip

使用 [Collections](./Collection.md) 使其可变（可以[赋值](./Collection.md#assign)新的条目）

:::

## 实例方法 {#instance-methods}

- `define(definition)`：调用时，传入的 `definition` 会与传给 `Values` 构造函数的原始 definition 合并。这个方法通常用于在 schema 中创建循环引用。

:::info[命名]

`Values` 以 [Object.values()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Object/values) 命名，因为
它的 schema 用于描述对象的值。

:::

## 用法 {#usage}

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

### 更新多个 entity {#updating-many-entities}

将 Values 与 [Controller.set()](/docs/api/Controller#set-array) 搭配使用，即可在一次 store 更新中写入多个 entity，
无需 endpoint。

```ts
ctrl.set(getItems.schema, {
  firstThing: { id: 1 },
  secondThing: { id: 2 },
});
```

### 多态类型 {#polymorphic-types}

如果输入数据是一个对象，其值包含多种类型的 entity，而它们的 schema 又不容易通过键来确定，你可以使用 schema 映射，就像 [Union](./Union.md) 和 [schema.Array](./Array.md) 那样。

:::note

如果数据返回了一个你没有为其提供映射的对象，结果中会返回原始对象，并且不会创建 entity。

:::

#### string schemaAttribute {#string-schemaattribute}

<PolymorphicFeedDemo schema="Values" attribute="string" />

#### function schemaAttribute {#function-schemaattribute}

返回值应与 `definition` 中的某个键相匹配。这里我们展示与 'string'
情形相同的行为，只是会追加一个 's'。

<PolymorphicFeedDemo schema="Values" attribute="function" />
