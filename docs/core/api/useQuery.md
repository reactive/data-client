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
  { click: { selector: '.segmented button', hasText: 'Admins' } },
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
          <th>Role</th>
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
              <Avatar name={user.name} />
              {user.name}
            </td>
            <td>
              <span className={user.isAdmin ? 'pill primary' : 'pill'}>
                {user.isAdmin ? 'Admin' : 'Member'}
              </span>
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
      <header className="appHeader">
        <h1 className="appTitle">Team</h1>
        <RoleFilter isAdmin={isAdmin} onChange={setIsAdmin} />
      </header>
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
        <th>Role</th>
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
          <Avatar :name="user.name" />
          {{ user.name }}
        </td>
        <td>
          <span :class="user.isAdmin ? 'pill primary' : 'pill'">
            {{ user.isAdmin ? 'Admin' : 'Member' }}
          </span>
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
  <header class="appHeader">
    <h1 class="appTitle">Team</h1>
    <RoleFilter :is-admin="isAdmin" @change="isAdmin = $event" />
  </header>
  <UsersTable :sort="sort" :is-admin="isAdmin" @sort="sort = $event" />
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
