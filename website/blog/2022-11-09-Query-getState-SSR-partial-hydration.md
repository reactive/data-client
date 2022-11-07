---
title: Query, getState() and partial hydration SSR improvements
authors: [ntucker]
tags:
  [
    releases,
    rest-hooks,
    packages,
    rest,
    resource,
    endpoint,
  ]
---

We recently release two new package versions [Rest Hooks@6.5](https://github.com/coinbase/rest-hooks/releases/tag/rest-hooks%406.5.0) and [@rest-hooks/rest@6.1](https://github.com/coinbase/rest-hooks/releases/tag/%40rest-hooks%2Frest%406.1.0). These
include some solutions to long-standing user-requested functionality. Additionally, we'll give a preview of even more
features soon to come.

### Rest Hooks 6.5

- Better [partial hydration SSR support](/blog/2022/11/09/Query-getState-SSR-partial-hydration#partial-hydration-ssr) and compatibility with NextJS SSR
- [Controller.getState()](/blog/2022/11/09/Query-getState-SSR-partial-hydration#controllergetstate) provides access to
state inside event handlers

### @rest-hooks/rest 6.1

- [Query](/blog/2022/11/09/Query-getState-SSR-partial-hydration#query) provides programmatic access to the Rest Hooks store.
- [schema.All()](/blog/2022/11/09/Query-getState-SSR-partial-hydration#schemaall) retrieves all entities in the store. Very useful with [Query](/blog/2022/11/09/Query-getState-SSR-partial-hydration#query)

<!--truncate-->

import HooksPlayground from '@site/src/components/HooksPlayground';
import { RestEndpoint } from '@rest-hooks/rest';

## New Features

### Partial Hydration SSR

Client-side React concurrent features like startTransition only work with Context. However, server-side,
React will only re-render Suspended elements. This means any context provides must suspend the context themselves,
which would mean the suspense boundaries would have to be around the entire application.

With this update, we use [useSyncExternalStore](https://reactjs.org/docs/hooks-reference.html#usesyncexternalstore) if
when running SSR. This is not ideal to replace client render because it eliminates startTransition benefits client-side.

In addition, the [SSR helpers](https://www.npmjs.com/package/@rest-hooks/ssr) were updated to better
handle these use cases. You can use the [@rest-hooks/ssr readme](https://www.npmjs.com/package/@rest-hooks/ssr) for
instructions on usage with vanilla React 18.

[PR](https://github.com/coinbase/rest-hooks/pull/2253)

#### What's next

Currently there is no documentation on SSR on this docs site, even though we have one [working demo](https://stackblitz.com/github/ntucker/anansi/tree/master/examples/concurrent) and [@rest-hooks/ssr readme](https://www.npmjs.com/package/@rest-hooks/ssr) for vanilla React 18. We will soon be adding guides to this site for React 18, as well as frameworks like NextJS.

### Controller.getState()

Oftentimes control flow in an event handler after a mutation relies on the data from that mutation. For instance,
performing a url redirect to a newly created member. When taking advantage of the Rest Hooks data model for things like
[computed properties](/rest/guides/computed-properties) this can mean having the raw fetch response is not enough.

With [Controller.getState()](/docs/api/Controller#getState) you can access the same (with referential equality guarantees!)
data you would get from a data-binding hook like [useSuspense](/docs/api/useSuspense) or [useCache](/docs/api/useCache).

Be careful though as this can lead to race conditions if used outside of an event handler. For this
reason we kept its usage explicit so you can always see where the data is coming from.

```tsx
const controller = useController();

const updateHandler = useCallback(
  async updatePayload => {
    await controller.fetch(
      MyResource.update,
      { id },
      updatePayload,
    );
    const denormalized = controller.getResponse(
      MyResource.update,
      { id },
      updatePayload,
      controller.getState(),
    );
    redirect(denormalized.getterUrl);
  },
  [id],
);
```

[PR](https://github.com/coinbase/rest-hooks/pull/2252)

### Query

[Query](/rest/api/Query) provides programmatic access to the Rest Hooks store. This improves post-processing
use cases, by providing a mechanism to take advtange of the global memoization for improved performance as well as
easy code-sharing of Endpoint interfaces.

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
]}>

```ts title="api/User.ts" collapsed
export class User extends Entity {
  id = '';
  name = '';
  isAdmin = false;
  pk() {
    return this.id;
  }
}
export const UserResource = createResource({
  path: '/users/:id',
  schema: User,
});
```

```tsx title="UsersPage.tsx" {15}
import { Query, schema } from '@rest-hooks/rest';
import { UserResource, User } from './api/User';

const sortedUsers = new Query(
  new schema.All(User),
  (entries, { asc } = { asc: false }) => {
    const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));
    if (asc) return sorted;
    return sorted.reverse();
  }
);

function UsersPage() {
  useFetch(UserResource.getList);
  const users = useCache(sortedUsers, { asc: true });
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

[PR](https://github.com/coinbase/rest-hooks/pull/2229)

### schema.All

[schema.All](/rest/api/All) retrieves all entities in cache as an Array. This provides a new way
of accessing the Rest Hooks store, and when combined with [Query](/rest/api/Query) can be very powerful.

#### What's next

Inspired by [BackboneJS](https://backbonejs.org/#Collection), `Collections` are a new schema
planned to better handle many-to-one and many-to-many relationships alongside [creates](/rest/api/createResource#create).
They should eliminate the need for [programmatic updates](/rest/api/RestEndpoint#update)

```ts
controller.fetch(
  MyResource.getList.create,
  // same params as getList
  { owner, repo },
  // payload ('body')
  FormObject
);
```
