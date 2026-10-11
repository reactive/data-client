---
title: useQuery() - 在 React 中访问规范化数据 store
vue_title: useQuery() - 在 Vue 中访问规范化数据 store
sidebar_label: useQuery()
description: 无需获取即可渲染数据。访问任意 Schema 在 store 中经过记忆化的值。
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import StackBlitz from '@site/src/components/StackBlitz';
import { RestEndpoint } from '@data-client/rest';
import VoteDemo from '../shared/\_VoteDemo.mdx';
import VueArgs from '../shared/\_vueArgs.mdx';

# useQuery()

无需获取即可渲染数据。

访问任意 [Queryable Schema](/rest/api/schema#queryable) 在 store 中的值；例如 [Entity](/rest/api/Entity)、[All](/rest/api/All)、[Collection](/rest/api/Collection)、[Query](/rest/api/Query)、
[Union](/rest/api/Union) 和 [Scalar](/rest/api/Scalar)。[Lazy](/rest/api/Lazy) 字段也可以通过其 [`.query`](/rest/api/Lazy#query) 访问器使用。
如果该值不存在，则返回 `undefined`。

`useQuery()` 会响应数据[变更](../getting-started/mutations.md)；只在必要时重新渲染。当数据为 [Invalid](../concepts/expiry-policy#invalid) 时
返回 `undefined`。

:::tip

[Queries](/rest/api/Query) 是高效渲染聚合计算的好帮手，例如使用 [groupBy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy#browser_compatibility)、
[map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)、[reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) 和 [filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) 的计算。

:::

## 用法 {#usage}

<VoteDemo defaultTab="TotalVotes" />

关于类型处理的更多信息，请参阅
[真值收窄](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#truthiness-narrowing)

## 类型 {#types}

:::react

<GenericsTabs>

```typescript
function useQuery(
  schema: Queryable,
  ...args: SchemaArgs<typeof schema>
): DenormalizeNullable<typeof endpoint.schema> | undefined;
```

```typescript
function useQuery<S extends Queryable>(
  schema: S,
  ...args: SchemaArgs<S>
): DenormalizeNullable<S> | undefined;
```

</GenericsTabs>

:::

:::vue

```typescript
function useQuery<S extends Queryable>(
  schema: S,
  ...args: MaybeRefsOrGetters<SchemaArgs<S>>
): ComputedRef<DenormalizeNullable<S> | undefined>;
```

<VueArgs />

参数变化时，结果会随之更新。

:::

### Queryable {#queryable}

[Queryable](/rest/api/schema#queryable) schema 需要一个有返回值的 `queryKey()` 方法。这包括
[Entity](/rest/api/Entity)、[All](/rest/api/All)、[Collection](/rest/api/Collection)、[Query](/rest/api/Query)、
[Union](/rest/api/Union) 和 [Scalar](/rest/api/Scalar)。[Lazy](/rest/api/Lazy) 字段通过其 [`.query`](/rest/api/Lazy#query) 访问器产生一个 Queryable。

```ts
interface Queryable {
  queryKey(
    args: readonly any[],
    queryKey: (...args: any) => any,
    getEntity: GetEntity,
    getIndex: GetIndex,
    // Must be non-void
  ): {};
}
```

## 示例 {#examples}

<!-- TODO: Add examples for each Queryable schema type and the different args that can be sent (like index, vs pk; union needing 'type') -->

### 排序与过滤 {#sorting--filtering}

[Query](/rest/api/Query) 提供了以编程方式访问 Reactive Data Client store 的能力。

<FrameworkPlayground fixtures={[
{
endpoint: new RestEndpoint({path: '/users'}),
args: [],
response: [
{ id: '123', name: 'Jim' },
{ id: '456', name: 'Jane' },
{ id: '777', name: 'Albatras', isAdmin: true },
],
delay: 150,
},
]} row>

```ts title="UserResource" collapsed
import { Entity, resource } from '@data-client/rest';

export class User extends Entity {
  id = '';
  name = '';
  isAdmin = false;

  static key = 'User';
}
export const UserResource = resource({
  path: '/users/:id',
  schema: User,
});
```

:::react

```tsx title="UsersPage" {22}
import { All, Query } from '@data-client/rest';
import { useQuery, useFetch } from '@data-client/react';
import { UserResource, User } from './UserResource';

interface Args {
  asc: boolean;
  isAdmin?: boolean;
}
const sortedUsers = new Query(
  new All(User),
  (entries, { asc, isAdmin }: Args = { asc: false }) => {
    let sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));
    if (isAdmin !== undefined)
      sorted = sorted.filter(user => user.isAdmin === isAdmin);
    if (asc) return sorted;
    return sorted.reverse();
  },
);

function UsersPage() {
  useFetch(UserResource.getList);
  const users = useQuery(sortedUsers, { asc: true });
  if (!users) return <div>No users in cache yet</div>;
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

```html title="UsersPage.vue" {22}
<script setup lang="ts">
  import { Query, All } from '@data-client/rest';
  import { useQuery, useFetch } from '@data-client/vue';
  import { UserResource, User } from './UserResource';

  interface Args {
    asc: boolean;
    isAdmin?: boolean;
  }
  const sortedUsers = new Query(
    new All(User),
    (entries, { asc, isAdmin }: Args = { asc: false }) => {
      let sorted = [...entries].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      if (isAdmin !== undefined)
        sorted = sorted.filter(user => user.isAdmin === isAdmin);
      if (asc) return sorted;
      return sorted.reverse();
    },
  );

  useFetch(UserResource.getList);
  const users = useQuery(sortedUsers, { asc: true });
</script>

<template>
  <div v-if="!users">No users in cache yet</div>
  <div v-else>
    <div v-for="user in users" :key="user.pk()">{{ user.name }}</div>
  </div>
</template>
```

:::

</FrameworkPlayground>

:::react

### 剩余 Todo 总数 {#remaining-todo-total}

[Queries](/rest/api/Query) 也可以用来计算聚合值

<StackBlitz app="todo-app" file="src/resources/TodoResource.ts,src/pages/Home/TodoStats.tsx" height="420" />

:::

### Lazy 关系 {#lazy-relationships}

[Lazy](/rest/api/Lazy) 字段在父级反规范化时保留原始 ID。将 [`.query`](/rest/api/Lazy#query) 与 `useQuery` 搭配使用即可按需解析它们，
从而把重新渲染限制在真正需要相关数据的组件内。

<FrameworkPlayground fixtures={[
{
endpoint: new RestEndpoint({path: '/departments'}),
args: [],
response: [
{ id: '1', name: 'Engineering', buildings: [
{ id: 'b1', name: 'HQ' },
{ id: 'b2', name: 'Annex' },
]},
{ id: '2', name: 'Design', buildings: [
{ id: 'b1', name: 'HQ' },
{ id: 'b3', name: 'Studio' },
]},
],
delay: 150,
},
]} row>

```ts title="Resources" collapsed
import { Entity, Lazy, resource } from '@data-client/rest';

export class Building extends Entity {
  id = '';
  name = '';

  static key = 'Building';
}

export class Department extends Entity {
  id = '';
  name = '';
  buildings: string[] = [];

  static schema = {
    buildings: new Lazy([Building]),
  };
  static key = 'Department';
}

export const DepartmentResource = resource({
  path: '/departments/:id',
  schema: Department,
});
```

:::react

```tsx title="DepartmentsPage" {8}
import { All } from '@data-client/rest';
import { useQuery, useFetch } from '@data-client/react';
import { DepartmentResource, Department } from './Resources';

function BuildingList({ dept }: { dept: Department }) {
  const buildings = useQuery(
    Department.schema.buildings.query,
    dept.buildings,
  );
  if (!buildings) return null;
  return <span>{buildings.map(b => b.name).join(', ')}</span>;
}

function DepartmentsPage() {
  useFetch(DepartmentResource.getList);
  const departments = useQuery(new All(Department));
  if (!departments) return <div>Loading...</div>;
  return (
    <div>
      {departments.map(dept => (
        <div key={dept.pk()}>
          <strong>{dept.name}</strong>: <BuildingList dept={dept} />
        </div>
      ))}
    </div>
  );
}
render(<DepartmentsPage />);
```

:::

:::vue

```html title="BuildingList.vue" {8-11}
<script setup lang="ts">
  import { computed } from 'vue';
  import { useQuery } from '@data-client/vue';
  import { Department } from './Resources';

  const props = defineProps<{ dept: Department }>();

  const buildings = useQuery(
    Department.schema.buildings.query,
    computed(() => props.dept.buildings),
  );
</script>

<template>
  <span v-if="buildings">{{ buildings.map(b => b.name).join(', ') }}</span>
</template>
```

```html title="DepartmentsPage.vue"
<script setup lang="ts">
  import { All } from '@data-client/rest';
  import { useQuery, useFetch } from '@data-client/vue';
  import { DepartmentResource, Department } from './Resources';
  import BuildingList from './BuildingList.vue';

  useFetch(DepartmentResource.getList);
  const departments = useQuery(new All(Department));
</script>

<template>
  <div v-if="!departments">Loading...</div>
  <div v-else>
    <div v-for="dept in departments" :key="dept.pk()">
      <strong>{{ dept.name }}</strong>: <BuildingList :dept="dept" />
    </div>
  </div>
</template>
```

:::

</FrameworkPlayground>

:::react

### 数据 fallback {#data-fallbacks}

在这个例子中，`Ticker` 会通过 websocket 流不断更新。然而，`Ticker` 没有批量/列表
获取接口——这使得在列表视图中获取价格的效率很低。

因此在这种情况下，我们可以获取 `Stats` 列表作为 fallback，因为它同样包含价格数据。

<StackBlitz app="coin-app" file="src/pages/Home/CurrencyList.tsx,src/resources/fallbackQueries.ts,src/pages/Home/AssetPrice.tsx" />

:::
