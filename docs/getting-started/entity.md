---
title: Entity and Data Normalization
sidebar_label: Entity
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';

[Entities](./Entity) have a primary key. This enables easy access via a lookup table.
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
  const presentation = useResource(PresentationList, {});
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

When an endpoint changes data, this is known as a [side effect](../guides/rpc.md). Marking an endpoint with [sideEffect: true](../api/Endpoint.md#sideeffect)
tells Rest Hooks that this endpoint is not idempotent, and thus should not be allowed in hooks
that may call the endpoint an arbitrary number of times like [useResource()](../api/useResource.md) or [useRetrieve()](../api/useRetrieve.md)

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
import { useFetcher } from 'rest-hooks';

export default function NewTodoForm() {
  const create = useFetcher(todoCreate);
  return (
    <Form onSubmit={e => create(new FormData(e.target))}>
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
import { useFetcher } from 'rest-hooks';

export default function UpdateTodoForm({ id }: { id: number }) {
  const todo = useResource(todoDetail, { id });
  const update = useFetcher(todoUpdate);
  return (
    <Form
      onSubmit={e => update({ id }, new FormData(e.target))}
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
import { useFetcher } from 'rest-hooks';
import ArticleResource from 'resources/article';

export default function TodoWithDelete({ todo }: { todo: Todo }) {
  const del = useFetcher(todoDelete);
  return (
    <div>
      {todo.title}
      <button onClick={() => del({ id: todo.id })}>Delete</button>
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

Schemas are a declarative definition of how to [process responses](./schema)

- [where](./schema) to expect [Entities](../api/Entity.md)
- Classes to [deserialize fields](../guides/network-transform#deserializing-fields)

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

Placing our [Entity](../api/Entity.md) `Todo` in an array, tells Rest Hooks to expect
an array of `Todos`.

Aside from array, there are a few more 'schemas' provided for various patterns. The first two (Object and Array)
have shorthands of using object and array literals.

- [Object](../api/Object.md): maps with known keys
- [Array](../api/Array.md): variably sized arrays
- [Union](../api/Union.md): select from many different types
- [Values](../api/Values.md): maps with any keys - variably sized
- [Delete](../api/Delete.md): remove an entity

[Learn more](../api/schema.md)

### Nesting

Additionally, [Entities](../api/Entity.md) themselves can specify [nested](../guides/nested-response.md) [schemas](../api/schema.md)
by specifying a [static schema](../api/Entity.md#schema) member.

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


[Learn more](../guides/nested-response.md)

### Data Representations

Additionally, any `newable` class that has a toJSON() method, can be [used as a schema](../guides/network-transform#deserializing-fields). This will simply construct the object during denormalization.
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
