---
title: useQuery() - Normalized data store access in React
sidebar_label: useQuery()
description: Data rendering without the fetch. Access any Schema's memoized store value.
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import HooksPlayground from '@site/src/components/HooksPlayground';
import StackBlitz from '@site/src/components/StackBlitz';
import { RestEndpoint } from '@data-client/rest';
import VoteDemo from '../shared/\_VoteDemo.mdx';

# useQuery()

Query the store.

Renders any [Queryable Schema](/rest/api/schema#queryable) like [Entity](/rest/api/Entity), [All](/rest/api/All), [Collection](/rest/api/Collection), [Query](/rest/api/Query),
and [Union](/rest/api/Union) from the store.

[Queries](/rest/api/Query) are a great companion to efficiently render aggregate computations like those that use [groupBy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy#browser_compatibility),
[map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map), [reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce), and [filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter).

`useQuery()` is reactive to data [mutations](../getting-started/mutations.md); rerendering only when necessary. Returns `undefined`
when data is [Invalid](../concepts/expiry-policy#invalid).

## Usage

<VoteDemo defaultTab="TotalVotes" />

See [truthiness narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#truthiness-narrowing) for
more information about type handling

## Types

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

### Queryable

[Queryable](/rest/api/schema#queryable) schemas require an `queryKey()` method that returns something. These include
[Entity](/rest/api/Entity), [All](/rest/api/All), [Collection](/rest/api/Collection), [Query](/rest/api/Query),
and [Union](/rest/api/Union).

```ts
interface Queryable {
  queryKey(
    args: readonly any[],
    queryKey: (...args: any) => any,
    getEntity: GetEntity,
    getIndex: GetIndex,
    // Must be non-void
  ): {};
};
```

## Examples

<!-- TODO: Add examples for each Queryable schema type and the different args that can be sent (like index, vs pk; union needing 'type') -->

### Sorting & Filtering

[Query](/rest/api/Query) provides programmatic access to the Reactive Data Client store.

<HooksPlayground fixtures={[
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
  pk() {
    return this.id;
  }
  static key = 'User';
}
export const UserResource = resource({
  path: '/users/:id',
  schema: User,
});
```

```tsx title="UsersPage" {22}
import { schema } from '@data-client/rest';
import { useQuery, useFetch } from '@data-client/react';
import { UserResource, User } from './UserResource';

interface Args {
  asc: boolean;
  isAdmin?: boolean;
}
const sortedUsers = new schema.Query(
  new schema.All(User),
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

</HooksPlayground>

### Remaining Todo total

[Queries](/rest/api/Query) can also be used to compute aggregates

<StackBlitz app="todo-app" file="src/resources/TodoResource.ts,src/pages/Home/TodoStats.tsx" />
