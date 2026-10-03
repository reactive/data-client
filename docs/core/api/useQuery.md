---
title: useQuery() - Normalized data store access in React
vue_title: useQuery() - Normalized data store access in Vue
sidebar_label: useQuery()
description: Data rendering without the fetch. Access any Schema's memoized store value.
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import StackBlitz from '@site/src/components/StackBlitz';
import { RestEndpoint } from '@data-client/rest';
import VoteDemo from '../shared/\_VoteDemo.mdx';

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

:::react

<VoteDemo defaultTab="TotalVotes" />

:::

:::vue

<TypeScriptEditor row defaultTab="TotalVotes.vue">

```ts title="Post" collapsed
import { Entity, schema } from '@data-client/rest';

export class Post extends Entity {
  id = 0;
  author = { id: 0 };
  title = '';
  body = '';
  votes = 0;

  static key = 'Post';

  static schema = {
    author: EntityMixin(
      class User {
        id = 0;
      },
    ),
  };

  get img() {
    return `//loremflickr.com/96/72/kitten,cat?lock=${this.id % 16}`;
  }
}
```

```ts title="PostResource" {15-22}
import { resource } from '@data-client/rest';
import { Post } from './Post';

export { Post };

export const PostResource = resource({
  path: '/posts/:id',
  searchParams: {} as { userId?: string | number } | undefined,
  schema: Post,
}).extend('vote', {
  path: '/posts/:id/vote',
  method: 'POST',
  body: undefined,
  schema: Post,
  getOptimisticResponse(snapshot, { id }) {
    const post = snapshot.get(Post, { id });
    if (!post) throw snapshot.abort;
    return {
      id,
      votes: post.votes + 1,
    };
  },
});
```

```html title="PostItem.vue" collapsed
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { PostResource, type Post } from './PostResource';

  const props = defineProps<{ post: Post }>();
  const ctrl = useController();
  const handleVote = () => {
    ctrl.fetch(PostResource.vote, { id: props.post.id });
  };
</script>

<template>
  <div>
    <div class="voteBlock">
      <small class="vote">
        <button class="up" @click="handleVote">&nbsp;</button>
        {{ post.votes }}
      </small>
      <img :src="post.img" width="70" height="52" />
    </div>
    <div>
      <h4>{{ post.title }}</h4>
      <p>{{ post.body }}</p>
    </div>
  </div>
</template>
```

```html title="TotalVotes.vue" {12}
<script setup lang="ts">
  import { schema } from '@data-client/rest';
  import { useQuery } from '@data-client/vue';
  import { PostResource } from './PostResource';

  const props = defineProps<{ userId: number }>();

  const queryTotalVotes = new schema.Query(
    PostResource.getList.schema,
    posts => posts.reduce((total, post) => total + post.votes, 0),
  );
  const totalVotes = useQuery(queryTotalVotes, { userId: props.userId });
</script>

<template>
  <center>
    <small>{{ totalVotes }} votes total</small>
  </center>
</template>
```

```html title="PostList.vue" collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { PostResource } from './PostResource';
  import PostItem from './PostItem.vue';
  import TotalVotes from './TotalVotes.vue';

  const userId = 2;
  const posts = await useSuspense(PostResource.getList, { userId });
</script>

<template>
  <div>
    <PostItem v-for="post in posts" :key="post.pk()" :post="post" />
    <TotalVotes :userId="userId" />
  </div>
</template>
```

</TypeScriptEditor>

:::

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

Arguments can be plain values or [refs](https://vuejs.org/api/reactivity-core.html#ref) (including
[computed](https://vuejs.org/api/reactivity-core.html#computed)); the result updates when they change.

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

[Query](/rest/api/Query) provides programmatic access to the Reactive Data Client store.

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
import { Query } from '@data-client/rest';
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
      let sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));
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

```tsx title="DepartmentsPage" {7}
import { useQuery, useFetch } from '@data-client/react';
import { DepartmentResource, Department } from './Resources';

function BuildingList({ dept }: { dept: Department }) {
  const buildings = useQuery(
    Department.schema.buildings.query,
    dept.buildings,
  );
  if (!buildings) return null;
  return (
    <span>{buildings.map(b => b.name).join(', ')}</span>
  );
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

### Data fallbacks

In this case `Ticker` is constantly updated from a websocket stream. However, there is no bulk/list
fetch for `Ticker` - making it inefficient for getting the prices on a list view.

So in this case we can fetch a list of `Stats` as a fallback since it has price data as well.

<StackBlitz app="coin-app" file="src/pages/Home/CurrencyList.tsx,src/resources/fallbackQueries.ts,src/pages/Home/AssetPrice.tsx" />

:::
