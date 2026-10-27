---
title: useQuery() - Normalized data store access in React
vue_title: useQuery() - Normalized data store access in Vue
sidebar_label: useQuery()
description: Data rendering without the fetch. Access any Schema's memoized store value.
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
  { click: { selector: '.buttonGroup button', hasText: 'Admins' } },
  { wait: 1800 },
  { click: { selector: 'button.sort', hasText: 'Joined' } },
];

# useQuery()

Data rendering without the fetch.

Access any [Queryable Schema](/rest/api/schema#queryable)'s store value; like [Entity](/rest/api/Entity), [All](/rest/api/All), [Collection](/rest/api/Collection), [Query](/rest/api/Query),
[Union](/rest/api/Union), and [Scalar](/rest/api/Scalar). [Lazy](/rest/api/Lazy) fields also work via their [`.query`](/rest/api/Lazy#query) accessor.
If the value does not exist, returns `undefined`.

`useQuery()` is reactive to data [mutations](../getting-started/mutations.md); rerendering only when necessary. Returns `undefined`
when data is [Invalid](../concepts/expiry-policy#invalid).

:::tip

[Queries](/rest/api/Query) are a great companion to efficiently render aggregate computations like those that use [groupBy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy#browser_compatibility),
[map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map), [reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce), and [filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter).

:::

## Usage

<VoteDemo defaultTab="TotalVotes" />

See [truthiness narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#truthiness-narrowing) for
more information about type handling

## Types

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

The result updates when the arguments change.

:::

### Queryable

[Queryable](/rest/api/schema#queryable) schemas require an `queryKey()` method that returns something. These include
[Entity](/rest/api/Entity), [All](/rest/api/All), [Collection](/rest/api/Collection), [Query](/rest/api/Query),
[Union](/rest/api/Union), and [Scalar](/rest/api/Scalar). [Lazy](/rest/api/Lazy) fields produce a Queryable via their [`.query`](/rest/api/Lazy#query) accessor.

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

## Examples

<!-- TODO: Add examples for each Queryable schema type and the different args that can be sent (like index, vs pk; union needing 'type') -->

### Sorting & Filtering

[Query](/rest/api/Query) sorts and filters what is already in the store, so picking another column
re-sorts the table without fetching again.

<FrameworkPlayground
fixtures={teamFixtures}
row
defaultTab="sortedUsers"
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
```

```ts title="sortedUsers"
import { All, Query } from '@data-client/rest';
import { User } from './resources/User';

export type SortBy = 'name' | 'posts' | 'joined';
export interface Sort {
  sortBy: SortBy;
  desc: boolean;
}
interface Args extends Sort {
  /** admins only (true), members only (false), or everyone */
  isAdmin: boolean | undefined;
}

export const sortedUsers = new Query(
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
```

:::react

```tsx title="UsersPage" {15}
import React from 'react';
import { useQuery, useSuspense } from '@data-client/react';
import { UserResource } from './resources/User';
import { sortedUsers, type Sort, type SortBy } from './sortedUsers';

const filters = { All: undefined, Admins: true, Members: false };

function UsersPage() {
  useSuspense(UserResource.getList);
  const [sort, setSort] = React.useState<Sort>({
    sortBy: 'name',
    desc: false,
  });
  const [isAdmin, setIsAdmin] = React.useState<boolean>();
  const users = useQuery(sortedUsers, { ...sort, isAdmin }) ?? [];
  const onSort = (sortBy: SortBy) =>
    setSort(prev => ({
      sortBy,
      desc: prev.sortBy === sortBy && !prev.desc,
    }));

  return (
    <>
      <header className="appHeader">
        <h1 className="appTitle">Team</h1>
        <div className="buttonGroup">
          {Object.entries(filters).map(([label, value]) => (
            <button
              key={label}
              aria-pressed={isAdmin === value}
              onClick={() => setIsAdmin(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      <table>
        <thead>
          <tr>
            <SortHeader column="name" sort={sort} onSort={onSort}>
              Name
            </SortHeader>
            <th>Role</th>
            <SortHeader column="posts" sort={sort} onSort={onSort} numeric>
              Posts
            </SortHeader>
            <SortHeader
              column="joined"
              sort={sort}
              onSort={onSort}
              numeric
            >
              Joined
            </SortHeader>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.pk()}>
              <td>{user.name}</td>
              <td className="meta">{user.isAdmin ? 'Admin' : 'Member'}</td>
              <td className="value">{user.posts}</td>
              <td className="value">{user.joined}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function SortHeader({ column, sort, onSort, numeric, children }: Props) {
  const sorted = sort.sortBy === column;
  return (
    <th
      className={numeric ? 'value' : undefined}
      aria-sort={
        sorted ? (sort.desc ? 'descending' : 'ascending') : undefined
      }
    >
      <button className="sort" onClick={() => onSort(column)}>
        {children}
      </button>
    </th>
  );
}
interface Props {
  column: SortBy;
  sort: Sort;
  onSort: (column: SortBy) => void;
  numeric?: boolean;
  children: React.ReactNode;
}
render(<UsersPage />);
```

:::

:::vue

```html title="UsersPage.vue" {12-15}
<script setup lang="ts">
  import { ref } from 'vue';
  import { useQuery, useSuspense } from '@data-client/vue';
  import { UserResource } from './resources/User';
  import { sortedUsers, type Sort, type SortBy } from './sortedUsers';

  const filters = { All: undefined, Admins: true, Members: false };

  await useSuspense(UserResource.getList);
  const sort = ref<Sort>({ sortBy: 'name', desc: false });
  const isAdmin = ref<boolean>();
  const users = useQuery(sortedUsers, () => ({
    ...sort.value,
    isAdmin: isAdmin.value,
  }));
  function onSort(sortBy: SortBy) {
    const desc = sort.value.sortBy === sortBy && !sort.value.desc;
    sort.value = { sortBy, desc };
  }
  function ariaSort(column: SortBy) {
    if (sort.value.sortBy !== column) return undefined;
    return sort.value.desc ? 'descending' : 'ascending';
  }
</script>

<template>
  <header class="appHeader">
    <h1 class="appTitle">Team</h1>
    <div class="buttonGroup">
      <button
        v-for="(value, label) in filters"
        :key="label"
        :aria-pressed="isAdmin === value"
        @click="isAdmin = value"
      >
        {{ label }}
      </button>
    </div>
  </header>
  <table>
    <thead>
      <tr>
        <th :aria-sort="ariaSort('name')">
          <button class="sort" @click="onSort('name')">Name</button>
        </th>
        <th>Role</th>
        <th class="value" :aria-sort="ariaSort('posts')">
          <button class="sort" @click="onSort('posts')">Posts</button>
        </th>
        <th class="value" :aria-sort="ariaSort('joined')">
          <button class="sort" @click="onSort('joined')">Joined</button>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="user in users" :key="user.pk()">
        <td>{{ user.name }}</td>
        <td class="meta">{{ user.isAdmin ? 'Admin' : 'Member' }}</td>
        <td class="value">{{ user.posts }}</td>
        <td class="value">{{ user.joined }}</td>
      </tr>
    </tbody>
  </table>
</template>
```

:::

</FrameworkPlayground>

:::react

### Remaining Todo total

[Queries](/rest/api/Query) can also be used to compute aggregates

<StackBlitz app="todo-app" file="src/resources/TodoResource.ts,src/pages/Home/TodoStats.tsx" height="420" />

:::

### Lazy relationships

[Lazy](/rest/api/Lazy) fields keep raw IDs during parent denormalization. Use [`.query`](/rest/api/Lazy#query) with `useQuery` to resolve them on demand,
isolating re-renders to only the components that need the related data.

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

### Data fallbacks

In this case `Ticker` is constantly updated from a websocket stream. However, there is no bulk/list
fetch for `Ticker` - making it inefficient for getting the prices on a list view.

So in this case we can fetch a list of `Stats` as a fallback since it has price data as well.

<StackBlitz app="coin-app" file="src/pages/Home/CurrencyList.tsx,src/resources/fallbackQueries.ts,src/pages/Home/AssetPrice.tsx" />

:::
