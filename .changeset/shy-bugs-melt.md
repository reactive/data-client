---
'@data-client/rest': patch
---

Add RestEndpoint.remove

Creates a PATCH endpoint that both removes an entity from a Collection and updates the entity with the provided body data.

```ts
const getTodos = new RestEndpoint({
  path: '/todos',
  schema: new schema.Collection([Todo]),
});

// Removes Todo from collection AND updates it with new data
await ctrl.fetch(getTodos.remove, {}, { id: '123', title: 'Done', completed: true });
```

```ts
// Remove user from group list and update their group
await ctrl.fetch(
  UserResource.getList.remove,
  { group: 'five' },
  { id: 2, username: 'user2', group: 'newgroup' }
);
// User is removed from the 'five' group list
// AND the user entity is updated with group: 'newgroup'
```
