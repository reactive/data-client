---
title: Entity and Data Normalization
sidebar_label: Entity
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';

[Entities](/rest/api/Entity) have a primary key. This enables easy access via a lookup table.
This makes it easy to find, update, create, or delete the same data - no matter what
endpoint it was used in.

<!--
<LanguageTabs>

```ts
import { Entity } from '@rest-hooks/endpoint';

class Todo extends Entity {
  readonly id: number = 0;
  readonly userId: number = 0;
  readonly title: string = '';
  readonly completed: boolean = false;

  pk() {
    return `${this.id}`;
  }
}
```

```js
import { Entity } from '@rest-hooks/endpoint';

class Todo extends Entity {
  pk() {
    return `${this.id}`;
  }
}
```

</LanguageTabs>
-->

<Tabs
defaultValue="State"
values={[
{ label: 'State', value: 'State' },
{ label: 'Response', value: 'Response' },
{ label: 'Endpoint', value: 'Endpoint' },
{ label: 'Entity', value: 'Entity' },
{ label: 'React', value: 'React' },
]}>
<TabItem value="State">

![Entities cache](/img/entities.png)

</TabItem>
<TabItem value="Response">

```json
[
  { "id": 1, "title": "this is an entity" },
  { "id": 2, "title": "this is the second entity" }
]
```

</TabItem>
<TabItem value="Endpoint">

```typescript
const PresentationList = new Endpoint(
  () => fetch(`/presentations`).then(res => res.json()),
  { schema: [PresentationEntity] },
);
```

</TabItem>
<TabItem value="Entity">

```typescript
class PresentationEntity extends Entity {
  readonly id: string = '';
  readonly title: string = '';

  pk() {
    return this.id;
  }
}
```

</TabItem>
<TabItem value="React">

```tsx
export function PresentationsPage() {
  const presentation = useSuspense(PresentationList, {});
  return presentation.map(presentation => (
    <div key={presentation.pk()}>{presentation.title}</div>
  ));
}
```

</TabItem>
</Tabs>

Extracting entities from a response is known as `normalization`. Accessing a response reverses
the process via `denormalization`.

:::info Global Referential Equality

Using entities expands Rest Hooks' global referential equality guarantee beyond the granularity of
an entire endpoint response.

:::

## Mutations and Dynamic Data

When an endpoint changes data, this is known as a [side effect](/rest/guides/rpc). Marking an endpoint with [sideEffect: true](/rest/api/Endpoint#sideeffect)
tells Rest Hooks that this endpoint is not idempotent, and thus should not be allowed in hooks
that may call the endpoint an arbitrary number of times like [useSuspense()](../api/useSuspense.md) or [useFetch()](../api/useFetch.md)

By including the changed data in the endpoint's response, Rest Hooks is able to able to update
any entities it extracts by specifying the schema.

<Tabs
defaultValue="Create"
values={[
{ label: 'Create', value: 'Create' },
{ label: 'Update', value: 'Update' },
{ label: 'Delete', value: 'Delete' },
]}>
<TabItem value="Create">

```typescript
import { schema, Endpoint } from '@rest-hooks/endpoint';

const todoCreate = new Endpoint(
  (body: FormData) =>
    fetch(`https://jsonplaceholder.typicode.com/todos/`, {
      method: 'POST',
      body,
    }).then(res => res.json()),
  { schema: Todo, sideEffect: true },
);
```

<details><summary><b>Example Usage</b></summary>

```tsx
import { useController } from 'rest-hooks';

export default function NewTodoForm() {
  const { fetch } = useController();
  return (
    <Form onSubmit={e => fetch(todoCreate, new FormData(e.target))}>
      <FormField name="title" />
    </Form>
  );
}
```

</details>

</TabItem>
<TabItem value="Update">

```typescript
import { schema, Endpoint } from '@rest-hooks/endpoint';

const todoUpdate = new Endpoint(
  ({ id }: { id: number }, body: FormData) =>
    fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
      method: 'PUT',
      body,
    }).then(res => res.json()),
  { schema: Todo, sideEffect: true },
);
```

<details><summary><b>Example Usage</b></summary>

```tsx
import { useController } from 'rest-hooks';

export default function UpdateTodoForm({ id }: { id: number }) {
  const todo = useSuspense(todoDetail, { id });
  const { fetch } = useController();
  return (
    <Form
      onSubmit={e => fetch(todoUpdate, { id }, new FormData(e.target))}
      initialValues={todo}
    >
      <FormField name="title" />
    </Form>
  );
}
```

</details>

</TabItem>
<TabItem value="Delete">

```typescript
import { schema, Endpoint } from '@rest-hooks/endpoint';

const todoDelete = new Endpoint(
  ({ id }: { id: number }) =>
    fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
      method: 'DELETE',
    }).then(() => ({ id })),
  { schema: new schema.Delete(Todo), sideEffect: true },
);
```

<details><summary><b>Example Usage</b></summary>

```tsx
import { useController } from 'rest-hooks';
import ArticleResource from 'resources/article';

export default function TodoWithDelete({ todo }: { todo: Todo }) {
  const { fetch } = useController();
  return (
    <div>
      {todo.title}
      <button onClick={() => del(todoDelete, { id: todo.id })}>Delete</button>
    </div>
  );
}
```

</details>

</TabItem>
</Tabs>

:::info

Mutations automatically update the normalized cache, resulting in consistent and fresh data.

:::

## Schema

Schemas are a declarative definition of how to [process responses](/rest/api/schema)

- [where](/rest/api/schema) to expect [Entities](/rest/api/Entity)
- Classes to [deserialize fields](/rest/guides/network-transform#deserializing-fields)

```typescript
import { Endpoint } from '@rest-hooks/endpoint';

const fetchTodoList = (params: any) =>
  fetch(`https://jsonplaceholder.typicode.com/todos/`).then(res => res.json());

const todoList = new Endpoint(fetchTodoList, {
  // highlight-next-line
  schema: [Todo],
  sideEffect: true,
});
```

Placing our [Entity](/rest/api/Entity) `Todo` in an array, tells Rest Hooks to expect
an array of `Todos`.

Aside from array, there are a few more 'schemas' provided for various patterns. The first two (Object and Array)
have shorthands of using object and array literals.

- [Object](/rest/api/Object): maps with known keys
- [Array](/rest/api/Array): variably sized arrays
- [Union](/rest/api/Union): select from many different types
- [Values](/rest/api/Values): maps with any keys - variably sized
- [Delete](/rest/api/Delete): remove an entity

[Learn more](/rest/api/schema)

### Nesting

Additionally, [Entities](/rest/api/Entity) themselves can specify [nested](/rest/guides/nested-response) [schemas](/rest/api/schema)
by specifying a [static schema](/rest/api/Entity#schema) member.

<Tabs
defaultValue="Entity"
values={[
{ label: 'Entity', value: 'Entity' },
{ label: 'Response', value: 'Response' },
]}>
<TabItem value="Entity">

```typescript
import { Entity } from '@rest-hooks/endpoint';

class Todo extends Entity {
  readonly id: number = 0;
  readonly user: User = User.fromJS({});
  readonly title: string = '';
  readonly completed: boolean = false;

  pk() {
    return `${this.id}`;
  }

  // highlight-start
  static schema = {
    user: User,
  };
  // highlight-end
}

class User extends Entity {
  readonly id: number = 0;
  readonly username: string = '';

  pk() {
    return `${this.id}`;
  }
}
```

</TabItem>
<TabItem value="Response">

```json
{
  "id": 5,
  "user": {
    "id": 10,
    "username": "bob",
  },
  "title": "Write some Entities",
  "completed": false
}
```

</TabItem>
</Tabs>


[Learn more](/rest/guides/nested-response)

### Data Representations

Additionally, any `newable` class that has a toJSON() method, can be [used as a schema](/rest/guides/network-transform#deserializing-fields). This will simply construct the object during denormalization.
This might be useful with representations like [bignumber](https://mikemcl.github.io/bignumber.js/)

```ts
import { Entity } from '@rest-hooks/endpoint';

class Todo extends Entity {
  readonly id: number = 0;
  readonly user: User = User.fromJS({});
  readonly title: string = '';
  readonly completed: boolean = false;
  // highlight-next-line
  readonly dueDate: Date = new Date(0);

  pk() {
    return `${this.id}`;
  }

  static schema = {
    user: User,
    // highlight-next-line
    dueDate: Date,
  };
}
```

:::info

Due to the global referential equality guarantee - construction of members only occurs once
per update.

:::
