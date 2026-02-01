---
name: rdc-schema
description: Define data schemas - Entity, Collection, Union, Query, pk/primary key, normalize/denormalize, relational/nested data, polymorphic types, Invalidate, Values
license: Apache 2.0
---

## 1. Defining Schemas

Define [schemas](references/schema.md) to represent the JSON returned by an endpoint. Compose these
to represent the data expected.

### Object

- [Entity](references/Entity.md) - represents a single unique object (denormalized)
- [new Union(Entity)](references/Union.md) - polymorphic objects (A | B)
- `{[key:string]: Schema}` - immutable objects
- [new Invalidate(Entity|Union)](references/Invalidate.md) - to delete an Entity

### List

- [new Collection([Schema])](references/Collection.md) - mutable/growable lists
- `[Schema]` - immutable lists
- [new All(Entity|Union)](references/All.md) - list all Entities of a kind

### Map

- `new Collection(Values(Schema))` - mutable/growable maps
- [new Values(Schema)](references/Values.md) - immutable maps

### Derived / selector pattern

- [new Query(Queryable)](references/Query.md) - memoized programmatic selectors
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

To define polymorphic resources (e.g., events), use [Union](references/Union.md) and a discriminator field.

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

# References

For detailed API documentation, see the [references](references/) directory:

- [Entity](references/Entity.md) - Normalized data class
- [Collection](references/Collection.md) - Mutable/growable lists
- [Union](references/Union.md) - Polymorphic schemas
- [Query](references/Query.md) - Programmatic selectors
- [Invalidate](references/Invalidate.md) - Delete entities
- [Values](references/Values.md) - Map schemas
- [All](references/All.md) - List all entities of a kind
- [Array](references/Array.md) - Immutable list schema
- [Object](references/Object.md) - Object schema
- [schema](references/schema.md) - Schema overview
- [relational-data](references/relational-data.md) - Relational data guide
- [computed-properties](references/computed-properties.md) - Computed properties guide
- [partial-entities](references/partial-entities.md) - Partial entities guide
- [side-effects](references/side-effects.md) - Side effects guide
- [sorting-client-side](references/sorting-client-side.md) - Client-side sorting guide
