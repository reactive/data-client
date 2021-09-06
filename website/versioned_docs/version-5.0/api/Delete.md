---
title: Delete
---

Describes entities to be marked as `DELETED`. This is a special symbol.

- `entity` which entity to delete. The input is used to compute the pk() for lookup.

## Usage

### Normalize

```typescript
// Example data response
const data = { users: [{ id: '123' }, { id: '543' }] };

class User extends Entity {
  readonly name: string = '';
  pk() {
    return this.id;
  }
}
const deleteSchema = { users: [new schema.Delete(User)] };

const normalizedData = normalize(data, deleteSchema);
```

Output

```js
{
  entities: {
    User: { '123': DELETED, '543': DELETED }
  },
  result: { User: [ '123', '543' ] }
}
```


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
  const list = useResource(MyResource.list(), {});
  const delMany = useFetcher(MyResource.deleteList());

  return (
    <div>
      <header>
        <span>My Table</span>
        <button onClick={() => delMany(selectedIds)}>Delete</button>
      </header>
      <TableBody data={list} form={TableForm} />
    </div>
  );
}
```

### Usage with useResource()

When entities are deleted in a result currently being presented in React, useResource()
will consider them invalid

- For optional Entities, they are simply removed
- For required Entities, this invalidates the entire response re-triggering suspense.
