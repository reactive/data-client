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
import { teamFixtures } from '@site/src/fixtures/team';
import VoteDemo from '../shared/\_VoteDemo.mdx';
import VueArgs from '../shared/\_vueArgs.mdx';

export const sortDemo = [
  // most posts first: the rows reorder, nothing refetches
  { delay: 1200, click: { selector: 'button.sort', hasText: 'Posts' } },
  { wait: 1200 },
  { click: { selector: 'button.sort', hasText: 'Posts' } },
  { wait: 1800 },
  { click: { selector: '.segmented button', hasText: 'Admins' } },
  { wait: 1800 },
  { click: { selector: 'button.sort', hasText: 'Joined' } },
];

# useQuery()

无需获取即可渲染数据。

访问任意 [Queryable Schema](/rest/api/schema#queryable) 在 store 中的值；例如 [Entity](/rest/api/Entity)、[Object](/rest/api/Object)、[All](/rest/api/All)、[Collection](/rest/api/Collection)、[Query](/rest/api/Query)、
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
[Entity](/rest/api/Entity)、[Object](/rest/api/Object)、[All](/rest/api/All)、[Collection](/rest/api/Collection)、[Query](/rest/api/Query)、
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

[Query](/rest/api/Query) 会对 store 中已有的数据进行排序和过滤，因此选择另一列时，
表格会重新排序而无需再次获取。

<FrameworkPlayground
fixtures={teamFixtures}
row
defaultTab="UsersTable"
autoRun={sortDemo}
>

```ts title="resources/User" collapsed
import { Entity, resource } from '@data-client/rest';

export class User extends Entity {
  id = '';
  name = '';
  isAdmin = false;
  posts = 0;
  joined = 0;

  static key = 'User';
}
export const UserResource = resource({
  path: '/users/:id',
  schema: User,
});

/** A users list's order: by one column, reversed when `desc` */
export type SortBy = 'name' | 'posts' | 'joined';
export interface Sort {
  sortBy: SortBy;
  desc: boolean;
}
```

:::react

```tsx title="RoleFilter" collapsed
const roles = { All: undefined, Admins: true, Members: false };

export default function RoleFilter({ isAdmin, onChange }: Props) {
  return (
    <div className="segmented" role="group" aria-label="Role">
      {Object.entries(roles).map(([label, value]) => (
        <button
          key={label}
          aria-pressed={isAdmin === value}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
interface Props {
  isAdmin: boolean | undefined;
  onChange: (isAdmin: boolean | undefined) => void;
}
```

```tsx title="UsersTableView" collapsed
import React from 'react';
import { type Sort, type SortBy, type User } from './resources/User';

export default function UsersTableView({ users, sort, onSort }: Props) {
  return (
    <table>
      <thead>
        <tr>
          <SortHeader column="name" sort={sort} onSort={onSort}>
            Name
          </SortHeader>
          <SortHeader column="posts" sort={sort} onSort={onSort} numeric>
            Posts
          </SortHeader>
          <SortHeader column="joined" sort={sort} onSort={onSort} numeric>
            Joined
          </SortHeader>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.pk()}>
            <td>
              {user.name} {user.isAdmin && <span className="pill">Admin</span>}
            </td>
            <td className="value">{user.posts}</td>
            <td className="value">{user.joined}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
interface Props {
  users: User[];
  sort: Sort;
  onSort: (sort: Sort) => void;
}

/** A column's header: sorts by it, and a second click reverses it */
function SortHeader({ column, sort, onSort, numeric, children }: HeaderProps) {
  const sorted = sort.sortBy === column;
  return (
    <th
      className={numeric ? 'value' : undefined}
      aria-sort={
        sorted ? (sort.desc ? 'descending' : 'ascending') : undefined
      }
    >
      <button
        className="sort"
        onClick={() => onSort({ sortBy: column, desc: sorted && !sort.desc })}
      >
        {children}
      </button>
    </th>
  );
}
interface HeaderProps {
  column: SortBy;
  sort: Sort;
  onSort: (sort: Sort) => void;
  numeric?: boolean;
  children: React.ReactNode;
}
```

```tsx title="UsersTable" {27}
import { All, Query } from '@data-client/rest';
import { useQuery, useSuspense } from '@data-client/react';
import { type Sort, User, UserResource } from './resources/User';
import UsersTableView from './UsersTableView';

interface Args extends Sort {
  /** admins only (true), members only (false), or everyone */
  isAdmin: boolean | undefined;
}

const sortedUsers = new Query(
  new All(User),
  (entries, { sortBy, desc, isAdmin }: Args) => {
    const users = entries
      .filter(user => isAdmin === undefined || user.isAdmin === isAdmin)
      .sort((a, b) =>
        sortBy === 'name' ?
          a.name.localeCompare(b.name)
        : a[sortBy] - b[sortBy],
      );
    return desc ? users.reverse() : users;
  },
);

export default function UsersTable({ sort, isAdmin, onSort }: Props) {
  useSuspense(UserResource.getList);
  const users = useQuery(sortedUsers, { ...sort, isAdmin }) ?? [];
  return <UsersTableView users={users} sort={sort} onSort={onSort} />;
}
interface Props {
  sort: Sort;
  isAdmin: boolean | undefined;
  onSort: (sort: Sort) => void;
}
```

```tsx title="UsersPage" collapsed
import React from 'react';
import RoleFilter from './RoleFilter';
import { type Sort } from './resources/User';
import UsersTable from './UsersTable';

function UsersPage() {
  const [sort, setSort] = React.useState<Sort>({
    sortBy: 'name',
    desc: false,
  });
  const [isAdmin, setIsAdmin] = React.useState<boolean>();
  return (
    <>
      <RoleFilter isAdmin={isAdmin} onChange={setIsAdmin} />
      <UsersTable sort={sort} isAdmin={isAdmin} onSort={setSort} />
    </>
  );
}
render(<UsersPage />);
```

:::

:::vue

```html title="RoleFilter.vue" collapsed
<script setup lang="ts">
  const roles = { All: undefined, Admins: true, Members: false };

  defineProps<{ isAdmin: boolean | undefined }>();
  const emit = defineEmits<{ change: [isAdmin: boolean | undefined] }>();
</script>

<template>
  <div class="segmented" role="group" aria-label="Role">
    <button
      v-for="(value, label) in roles"
      :key="label"
      :aria-pressed="isAdmin === value"
      @click="emit('change', value)"
    >
      {{ label }}
    </button>
  </div>
</template>
```

```html title="UsersTableView.vue" collapsed
<script setup lang="ts">
  import { type Sort, type SortBy, type User } from './resources/User';

  const props = defineProps<{ users: readonly User[]; sort: Sort }>();
  const emit = defineEmits<{ sort: [sort: Sort] }>();

  function ariaSort(column: SortBy) {
    if (props.sort.sortBy !== column) return undefined;
    return props.sort.desc ? 'descending' : 'ascending';
  }
  // a second click on the sorted column reverses it
  function toggleSort(column: SortBy) {
    const desc = props.sort.sortBy === column && !props.sort.desc;
    emit('sort', { sortBy: column, desc });
  }
</script>

<template>
  <table>
    <thead>
      <tr>
        <th :aria-sort="ariaSort('name')">
          <button class="sort" @click="toggleSort('name')">Name</button>
        </th>
        <th class="value" :aria-sort="ariaSort('posts')">
          <button class="sort" @click="toggleSort('posts')">Posts</button>
        </th>
        <th class="value" :aria-sort="ariaSort('joined')">
          <button class="sort" @click="toggleSort('joined')">Joined</button>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="user in users" :key="user.pk()">
        <td>
          {{ user.name }}
          <span v-if="user.isAdmin" class="pill">Admin</span>
        </td>
        <td class="value">{{ user.posts }}</td>
        <td class="value">{{ user.joined }}</td>
      </tr>
    </tbody>
  </table>
</template>
```

```html title="UsersTable.vue" {34-37}
<script lang="ts">
  import { All, Query } from '@data-client/rest';
  import { type Sort, User } from './resources/User';

  interface Args extends Sort {
    /** admins only (true), members only (false), or everyone */
    isAdmin: boolean | undefined;
  }

  const sortedUsers = new Query(
    new All(User),
    (entries, { sortBy, desc, isAdmin }: Args) => {
      const users = entries
        .filter(user => isAdmin === undefined || user.isAdmin === isAdmin)
        .sort((a, b) =>
          sortBy === 'name' ?
            a.name.localeCompare(b.name)
          : a[sortBy] - b[sortBy],
        );
      return desc ? users.reverse() : users;
    },
  );
</script>

<script setup lang="ts">
  import { useQuery, useSuspense } from '@data-client/vue';
  import { UserResource } from './resources/User';
  import UsersTableView from './UsersTableView.vue';

  const props = defineProps<{ sort: Sort; isAdmin: boolean | undefined }>();
  defineEmits<{ sort: [sort: Sort] }>();

  await useSuspense(UserResource.getList);
  const users = useQuery(sortedUsers, () => ({
    ...props.sort,
    isAdmin: props.isAdmin,
  }));
</script>

<template>
  <UsersTableView :users="users ?? []" :sort="sort" @sort="$emit('sort', $event)" />
</template>
```

```html title="UsersPage.vue" collapsed
<script setup lang="ts">
  import { ref } from 'vue';
  import RoleFilter from './RoleFilter.vue';
  import { type Sort } from './resources/User';
  import UsersTable from './UsersTable.vue';

  const sort = ref<Sort>({ sortBy: 'name', desc: false });
  const isAdmin = ref<boolean>();
</script>

<template>
  <RoleFilter :is-admin="isAdmin" @change="isAdmin = $event" />
  <UsersTable :sort="sort" :is-admin="isAdmin" @sort="sort = $event" />
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

```tsx title="DepartmentsPage" {6-9}
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
  if (!departments) return <Loading />;
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
  <Loading v-if="!departments" />
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
