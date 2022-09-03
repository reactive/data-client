---
title: Immediate Mutation Updates
---

When a user causes mutations like creating, updating, or deleting resources, it's important
to have those changed be reflected in the application. A simple publish cache
that has no underlying knowledge of the data structures would require a refetch of any endpoints
that are changed. This would reduce performance and put extra burden on the backend.

However, like many other cases, a normalized cache - one with underlying knowledge of the relationships
between resources - is capable of keeping all data consistent and fresh without
any refetches.

## Update

Rest Hooks uses your schema definitions to understand how to normalize response data into
an `entity table` and `result table`. Of course, this means that there is only ever one copy
of a given `entity`. Aside from providing consistency when using different response endpoints,
this means that by providing an accurate schema definition, Rest Hooks can automatically keep
all data uses consistent and fresh. The default update endpoints [Resource.update()](/rest/api/resource#update-endpoint) and
[Resource.partialUpdate()](/rest/api/resource#partialupdate-endpoint) both do this automatically. [Read more about defining other
update endpoints](/rest/guides/rpc)

## Delete

Rest Hooks automatically deletes entity entries [schema.Delete](/rest/api/Delete) is used.
[Resource.delete()](/rest/api/resource#delete-endpoint)
provides such an endpoint.

## Create

Like updates, created entities are automatically added to the entities table. This means
any components useSuspense() for just that item will be able to access it immediately and
not have to wait for an additional retrieval request. However, often new items are created
when viewing an entire list of items, and the create should result in that list - any maybe others -
displaying the newly created entry.

[Endpoint.update](/rest/api/Endpoint#update) handles this case

Simplest case:

```ts title="userEndpoint.ts"
const createUser = new Endpoint(postToUserFunction, {
  schema: User,
  update: (newUserId: string) => ({
    [userList.key()]: (users = []) => [newUserId, ...users],
  }),
});
```

More updates:

```typescript title="Component.tsx"
const allusers = useSuspense(userList);
const adminUsers = useSuspense(userList, { admin: true });
```

The endpoint below ensures the new user shows up immediately in the usages above.

```ts title="userEndpoint.ts"
const createUser = new Endpoint(postToUserFunction, {
  schema: User,
  update: (newUserId, newUser)  => {
    const updates = {
      [userList.key()]: (users = []) => [newUserId, ...users],
    ];
    if (newUser.isAdmin) {
      updates[userList.key({ admin: true })] = (users = []) => [newUserId, ...users];
    }
    return updates;
  },
});
```

This is usage with a [Resource](/rest/api/resource)

```typescript title="TodoResource.ts"
import { Resource } from '@rest-hooks/rest';

export default class TodoResource extends Resource {
  readonly id: number = 0;
  readonly userId: number = 0;
  readonly title: string = '';
  readonly completed: boolean = false;

  pk() {
    return `${this.id}`;
  }

  static urlRoot = 'https://jsonplaceholder.typicode.com/todos';

  static create<T extends typeof Resource>(this: T) {
    const todoList = this.list();
    return super.create().extend({
      schema: this,
      // highlight-start
      update: (newResourcePk: string) => ({
        [todoList.key({})]: (resourcePks: string[] = []) => [
          ...resourcePks,
          newResourcePk,
        ],
      }),
      // highlight-end
    });
  }
}
```

Extract the core logic for reuse

```typescript title="TodoResource.ts"
import { Resource } from '@rest-hooks/rest';

export default class TodoResource extends Resource {
  readonly id: number = 0;
  readonly userId: number = 0;
  readonly title: string = '';
  readonly completed: boolean = false;

  pk() {
    return `${this.id}`;
  }

  static urlRoot = 'https://jsonplaceholder.typicode.com/todos';

  static create<T extends typeof Resource>(this: T) {
    const todoList = this.list();
    return super.create().extend({
      schema: this,
      update: (newResourcePk: string) => ({
        // highlight-next-line
        [todoList.key({})]: this.appendList.bind(this, newResourcePk),
      }),
    });
  }

  // highlight-start
  static appendList(newResourcePk: string, resourcePks: string[] = []) {
    if (resourcePks.includes(newResourcePk)) return resourcePks;
    return [...resourcePks, newResourcePk];
  }
  // highlight-end
}
```
