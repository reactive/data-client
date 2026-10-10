---
title: Lazy Schema - 延迟的关系反规范化
sidebar_label: Lazy
---

# Lazy

`Lazy` 包裹一个 schema，用于跳过关系字段的即时反规范化。在父 Entity 反规范化时，该字段会保留其原始的规范化值（主键/ID）。之后可以通过 [useQuery](/docs/api/useQuery) 配合 `.query` 访问器按需解析该关系。

它适用于：
- 在递归反规范化时会导致调用栈溢出的**大型双向图**
- 通过延迟解析并非总是需要的关系来进行**性能优化**
- **记忆化隔离**——lazy Entity 的变化不会使父级的反规范化结果失效

## 构造函数 {#constructor}

```typescript
new Lazy(innerSchema)
```

- `innerSchema`：任意 [Schema](/rest/api/schema)——[Entity](./Entity.md)、类似 `[MyEntity]` 的数组简写、[Collection](./Collection.md) 等。

## 用法 {#usage}

### 数组关系（最常见） {#array-relationship-most-common}

```typescript
import { Entity, Lazy } from '@data-client/rest';

class Building extends Entity {
  id = '';
  name = '';
}

class Department extends Entity {
  id = '';
  name = '';
  buildings: string[] = [];

  static schema = {
    buildings: new Lazy([Building]),
  };
}
```

当 `Department` 被反规范化时，`dept.buildings` 包含的是原始主键（例如 `['bldg-1', 'bldg-2']`），而不是解析后的 `Building` 实例。

要解析这些 building，请使用 [useQuery](/docs/api/useQuery) 配合 `.query` 访问器：

:::react

```tsx
import { useQuery } from '@data-client/react';
import { Department } from './Department';

function DepartmentBuildings({ dept }: { dept: Department }) {
  // dept.buildings contains raw IDs: ['bldg-1', 'bldg-2']
  const buildings = useQuery(Department.schema.buildings.query, dept.buildings);
  // buildings: Building[] | undefined

  if (!buildings) return null;
  return (
    <ul>
      {buildings.map(b => <li key={b.id}>{b.name}</li>)}
    </ul>
  );
}
```

:::

:::vue

```html title="DepartmentBuildings.vue"
<script setup lang="ts">
  import { useQuery } from '@data-client/vue';
  import { Department } from './Department';

  const props = defineProps<{ dept: Department }>();

  // dept.buildings contains raw IDs: ['bldg-1', 'bldg-2']
  const buildings = useQuery(
    Department.schema.buildings.query,
    () => props.dept.buildings,
  );
  // buildings: ComputedRef<Building[] | undefined>
</script>

<template>
  <ul v-if="buildings">
    <li v-for="b in buildings" :key="b.id">{{ b.name }}</li>
  </ul>
</template>
```

:::

### 单个 Entity 关系 {#single-entity-relationship}

```typescript
class Department extends Entity {
  id = '';
  name = '';
  mainBuilding = '';

  static schema = {
    mainBuilding: new Lazy(Building),
  };
}
```

:::react

```tsx nocheck
// dept.mainBuilding is a raw PK string: 'bldg-1'
const building = useQuery(
  Department.schema.mainBuilding.query,
  { id: dept.mainBuilding },
);
```

:::

:::vue

```ts
// dept.mainBuilding is a raw PK string: 'bldg-1'
const building = useQuery(
  Department.schema.mainBuilding.query,
  () => ({ id: props.dept.mainBuilding }),
);
```

:::

当内部 schema 是 [Entity](./Entity.md)（或任何带有 `queryKey` 的 schema）时，`LazyQuery` 会委托给它的 `queryKey`——因此你传入的参数与直接查询该 Entity 时相同。

### Collection 关系 {#collection-relationship}

```typescript
class Department extends Entity {
  id = '';
  static schema = {
    buildings: new Lazy(buildingsCollection),
  };
}
```

```tsx nocheck
const buildings = useQuery(
  Department.schema.buildings.query,
  ...collectionArgs,
);
```

## `.query` {#query}

返回一个适用于 [useQuery](/docs/api/useQuery) 的 `LazyQuery` 实例。该 `LazyQuery`：

- **`queryKey(args)`**——如果内部 schema 具有 `queryKey`（Entity、Collection 等），则委托给它。否则直接返回 `args[0]`（适用于需要传入原始规范化值的数组/对象 schema）。
- **`denormalize(input, delegate)`**——委托给内部 schema，将 ID 解析为完整的 Entity 实例。

`.query` getter 总是返回同一个实例（已缓存）。

## 工作原理 {#how-it-works}

### 规范化 {#normalization}

`Lazy.normalize` 委托给内部 schema。Entity 照常存储在规范化的 Entity 表中——`Lazy` 对规范化没有任何影响。

### 反规范化（父级路径） {#denormalization-parent-path}

`Lazy.denormalize` 是一个**空操作**——它原样返回输入。当 `EntityMixin.denormalize` 遍历 schema 字段并遇到 `Lazy` 字段时，`unvisit` 分派会调用 `Lazy.denormalize`，后者只是把原始 PK 直接传递出去。不会访问任何嵌套的 Entity，也不会在缓存中注册任何依赖。

### 反规范化（useQuery 路径） {#denormalization-usequery-path}

使用 `useQuery(lazyField.query, ...)` 时，`LazyQuery.denormalize` 会通过 `unvisit` 委托给内部 schema，借助常规的反规范化流程将 ID 解析为完整的 Entity 实例。它运行在自己的 `MemoCache.query()` 作用域中，拥有独立的依赖追踪和 GC。

## 性能特征 {#performance-characteristics}

- **父级反规范化**：依赖跳数更少（lazy Entity 不计入依赖）。缓存命中更快。lazy Entity 变化时不会导致失效。
- **useQuery 访问**：拥有自己的记忆化作用域，以及自己的 `paths` 和 `countRef`。lazy Entity 的变化只会重新渲染调用了 `useQuery` 的组件，而不会重新渲染父组件。
- **没有 Proxy/getter 开销**：原始 ID 就是普通值。完整的解析只会通过 `useQuery`、沿常规的反规范化路径进行。
