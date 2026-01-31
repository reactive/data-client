---
name: rdc-schema
description: Define data schemas - Entity, Collection, Union, Query, pk/primary key, normalize/denormalize, relational/nested data, polymorphic types, Invalidate, Values
license: Apache 2.0
---

## 1. Defining Schemas

Define [schemas](https://dataclient.io/rest/api/schema) to represent the JSON returned by an endpoint. Compose these
to represent the data expected.

### Object

- [Entity](https://dataclient.io/rest/api/Entity) - represents a single unique object (denormalized)
- [new Union(Entity)](https://dataclient.io/rest/api/Union) - polymorphic objects (A | B)
- `{[key:string]: Schema}` - immutable objects
- `new Invalidate(Entity|Union)` - to delete an Entity

### List

- [new Collection([Schema])](https://dataclient.io/rest/api/Collection) - mutable/growable lists
- `[Schema]` - immutable lists
- `new All(Entity|Union)` - list all Entities of a kind

### Map

- `new Collection(Values(Schema))` - mutable/growable maps
- `new Values(Schema)` - immutable maps

### Programmatic

- [new Query(Queryable)](https://dataclient.io/rest/api/Query) - memoized programmatic selectors
  ```ts
  const queryRemainingTodos = new Query(
    TodoResource.getList.schema,
    entries => entries.filter(todo => !todo.completed).length,
  );
  ```

  ```ts
  const groupTodoByUser = new Query(
    TodoResource.getList.schema,
    todos => Object.groupBy(todos, todo => todo.userId),
  );
  ```

---

## 2. Entity best practices

- Every `Entity` subclass **defines defaults** for _all_ non-optional serialised fields.
- Override `pk()` only when the primary key ≠ `id`.
- `pk()` return type is `number | string | undefined`
- Override `Entity.process(value, parent, key, args)` to insert fields based on args/url
- `static schema` (optional) for nested schemas or deserialization functions
  - When designing APIs, prefer nesting entities

---

## 3. Entity lifecycle methods

- Normalize order: `process()` → `validate()` → `pk()` → if existing: `mergeWithStore()` which calls `shouldUpdate()` and maybe `shouldReorder()` + `merge()`; metadata via `mergeMetaWithStore()`.
- Denormalize order: `createIfValid()` → `validate()` → `fromJS()`.

---

## 4. **Union Types (Polymorphic Schemas)**

To define polymorphic resources (e.g., events), use [Union](https://dataclient.io/rest/api/Union) and a discriminator field.

```typescript
import { Union } from '@data-client/rest';

export abstract class Event extends Entity {
  type: EventType = 'Issue';    // discriminator field is shared
  /* ... */
}
export class PullRequestEvent extends Event { /* ... */ }
export class IssuesEvent extends Event { /* ... */ }

export const EventResource = resource({
  path: '/users/:login/events/public/:id',
  schema: new Union(
    {
      PullRequestEvent,
      IssuesEvent,
      // ...other event types...
    },
    'type', // discriminator field
  ),
});
```

---

## 5. Best Practices & Notes

- Always set up `schema` on every resource/entity/collection for normalization
- Normalize deeply nested or relational data by defining proper schemas

## 6. Common Mistakes to Avoid

- Don't forget to use `fromJS()` or assign default properties for class fields

# Official Documentation Links

- [Entity API](https://dataclient.io/rest/api/Entity)
- [Schema Guide](https://dataclient.io/rest/api/schema#schema-overview)
- [Relational Data Guide](https://dataclient.io/rest/guides/relational-data)
