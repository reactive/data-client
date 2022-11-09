---
title: Schemas and Normalized data
sidebar_label: Schema
---

Schemas are a declarative definition of how to [process responses](./schema)

- [where](./schema) to expect [Entities](../api/Entity.md)
- Classes to [deserialize fields](../guides/network-transform#deserializing-fields)

```typescript
import { Endpoint, Entity } from '@rest-hooks/endpoint';

class Todo extends Entity {
  readonly id: number = 0;
  readonly userId: number = 0;
  readonly title: string = '';
  readonly completed: boolean = false;

  pk() {
    return `${this.id}`;
  }
}

const TodoDetail = new Endpoint(
    ({ id }) ⇒ fetch(`https://jsonplaceholder.typicode.com/todos/${id}`),
    { schema: Todo }
);
```

## Entities

[Entities](../api/Entity.md) have a primary key. This enables easy access via a lookup table.
This makes it easy to find, update, create, or delete the same data - no matter what
endpoint it was used in.

<!--DOCUSAURUS_CODE_TABS-->
<!--State-->

![Entities cache](/img/entities.png)

<!--Response-->

```json
[
  { "id": 1, "title": "this is an entity" },
  { "id": 2, "title": "this is the second entity" }
]
```

<!--Endpoint-->

```typescript
const PresentationList = new Endpoint(
  () => fetch(`/presentations`).then(res => res.json()),
  { schema: [PresentationEntity] },
);
```

<!--Entity-->

```typescript
class PresentationEntity extends Entity {
  readonly id: string = '';
  readonly title: string = '';

  pk() {
    return this.id;
  }
}
```

<!--React-->

```tsx
export function PresentationsPage() {
  const presentation = useResource(PresentationList, {});
  return presentation.map(presentation => (
    <div key={presentation.pk()}>{presentation.title}</div>
  ));
}
```

<!--END_DOCUSAURUS_CODE_TABS-->

## Mutations and Dynamic Data

<!--DOCUSAURUS_CODE_TABS-->
<!--Create-->

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

<!--Update-->

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

<!--Delete-->

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

<!--END_DOCUSAURUS_CODE_TABS-->

Mutations automatically update the normalized cache, resulting in consistent and fresh data.
