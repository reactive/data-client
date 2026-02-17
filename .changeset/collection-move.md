---
'@data-client/endpoint': patch
'@data-client/rest': patch
'@data-client/graphql': patch
---

Add `Collection.move` schema and `RestEndpoint.move` extender for moving entities between collections.

`move` removes from collections matching the entity's existing state and adds to collections
matching the new values (from the body/last arg). Works for both Array and Values collections.

Path parameters filter collections by URL segments:

```ts
const UserResource = resource({
  path: '/groups/:group/users/:id',
  schema: User,
});

// PATCH /groups/five/users/2 - moves user 2 from 'five' group to 'ten' group
await ctrl.fetch(
  UserResource.getList.move,
  { group: 'five', id: '2' },
  { id: '2', group: 'ten' },
);
```

Search parameters filter collections by query args:

```ts
const TaskResource = resource({
  path: '/tasks/:id',
  searchParams: {} as { status: string },
  schema: Task,
});

// PATCH /tasks/3 - moves task 3 from 'backlog' to 'in-progress'
await ctrl.fetch(
  TaskResource.getList.move,
  { id: '3' },
  { id: '3', status: 'in-progress' },
);
```
