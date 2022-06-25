---
title: schema.Delete
---
<head>
  <title>schema.Delete - Invalidating Entities | Rest Hooks</title>
</head>

import HooksPlayground from '@site/src/components/HooksPlayground';

Describes entities to be marked as `DELETED`. This is a special symbol.

- `entity` which entity to delete. The input is used to compute the pk() for lookup.

## Usage

<HooksPlayground groupId="schema" defaultOpen="y">

```tsx
const sampleData = () =>
  Promise.resolve([
    { id: '123', name: 'Jim' },
    { id: '456', name: 'Jane' },
    { id: '555', name: 'Phone' },
  ]);
const sampleDelete = ({ id }) => Promise.resolve({ id });

class User extends Entity {
  readonly name: string = '';
  pk() {
    return this.id;
  }
}
const userList = new Endpoint(sampleData, {
  schema: [User],
});
const userDelete = new Endpoint(sampleDelete, {
  schema: new schema.Delete(User),
});
function UsersPage() {
  const users = useSuspense(userList, {});
  const { fetch } = useController();
  return (
    <div>
      {users.map(user => (
        <div key={user.pk()}>
          {user.name}{' '}
          <a
            style={{ cursor: 'pointer' }}
            onClick={() => fetch(userDelete, { id: user.id })}
          >
            ❌
          </a>
        </div>
      ))}
    </div>
  );
}
render(<UsersPage />);
```

</HooksPlayground>

### Batch Deletes

Here we add another endpoint for deleting many entities at a time. Here we
pass in a list of ids, and the response is an empty string.

Constructing an article response using the `params` argument in fetch empowers
the normalized cache to know which entities to delete when the request is success,
or if optimistic updates are used.

```typescript
import { Resource, schema } from '@rest-hooks/rest';

class MyResource extends Resource {
  static deleteList<T extends typeof MyResource>(this: T) {
    const init = this.getFetchInit({ method: 'DELETE' });
    return new Endpoint(
      (params: readonly string[]) =>
        this.fetch(this.url(params).then(() => params.map(id => ({ id })))),
      {
        ...this.getEndpointExtra(),
        schema: [new schemas.Delete(this)],
      },
    );
  }
}
```

```tsx
function MyTable() {
  const { selectedIds } = useFields(TableForm);
  const list = useSuspense(MyResource.list());
  const { fetch } = useController();

  return (
    <div>
      <header>
        <span>My Table</span>
        <button onClick={() => fetch(MyResource.deleteList(), selectedIds)}>
          Delete
        </button>
      </header>
      <TableBody data={list} form={TableForm} />
    </div>
  );
}
```

### Impact on useSuspense()

When entities are deleted in a result currently being presented in React, useSuspense()
will consider them invalid

- For optional Entities, they are simply removed
- For required Entities, this invalidates the entire response re-triggering suspense.
