---
name: data-client-schema
description: Model the app's data with @data-client schemas: the shape of each type, how types nest and relate, and how responses normalize and merge so one update shows everywhere. Use it whenever the shape of the app's data changes, when deriving values or views from data already loaded, or when the same item looks different in two places. Covers Entity, Collection, Union and Query.
license: Apache 2.0
---

## 1. Defining Schemas

Define [schemas](references/schema.md) to represent the JSON returned by an endpoint. Compose these
to represent the data expected.

### Object

- [Entity](references/Entity.md) - represents a single unique object (denormalized)
- [EntityMixin](references/EntityMixin.md) - turn any pre-existing class into an Entity
- [new Union(Entity)](references/Union.md) - polymorphic objects (A | B)
- [`{[key:string]: Schema}`](references/Object.md) - immutable objects
- [new Invalidate(Entity|Union)](references/Invalidate.md) - to delete an Entity
- [new Lazy(() => Schema)](references/Lazy.md) - break circular imports / defer deep recursive denormalization

### List

- [new Collection([Schema])](references/Collection.md) - mutable/growable lists
- [`[Schema]`](references/Array.md) - immutable lists
- [new All(Entity|Union)](references/All.md) - list all Entities of a kind

### Map

- `new Collection(Values(Schema))` - mutable/growable maps
- [new Values(Schema)](references/Values.md) - immutable maps

### Lens-dependent entity fields

- [new Scalar({ lens, key, entity? })](references/Scalar.md) - fields that vary by runtime lens (portfolio, currency, locale) without entity mutation

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

  Define `Query` transformations with the data model (e.g. `src/resources/`) — not inside custom hooks
  wrapping useSuspense/useQuery, which hides data dependencies and couples data logic to view code.

---

## 2. Entity best practices

- Every `Entity` subclass **defines defaults** for _all_ non-optional serialised fields.
- Override `pk()` only when the primary key ≠ `id`.
- [`static indexes = ['username' as const]`](references/Entity.md#indexes) to look up by a unique non-pk field with `useQuery(User, { username })`, instead of building lookup `Map`s
- `pk()` return type is `number | string | undefined`
- Override `Entity.process(value, parent, key, args)` to insert fields based on args/url
- `static schema` (optional) for nested schemas or deserialization functions
  - When designing APIs, prefer nesting entities

---

## 3. Entity lifecycle methods

- **Normalize** (JSON response → cache): operates on POJOs; output is JSON-serializable plain data stored in the normalized cache. Order: `process()` → `pk()` → [validate()](references/validation.md) → **visit nested schemas** (recurse into `schema` fields) → if existing: `mergeWithStore()` which calls `shouldUpdate()` and maybe `shouldReorder()` + `merge()`; metadata via `mergeMetaWithStore()`.
- **Older data arriving after newer** (a poll, slow request or embedded copy): override [`shouldReorder(existingMeta, incomingMeta, existing, incoming)`](references/Entity.md#shouldreorder) to compare a version field such as `updatedAt`; that alone keeps the newer fields. `shouldUpdate()` is for skipping updates to save work.
- **Denormalize** (cache → component): creates Entity **class instances** via `fromJS()`, restoring prototype chain so getters, methods, and `schema` processing work. Order: `createIfValid()` → [validate()](references/validation.md) → `fromJS()` → **unvisit nested schemas** (recurse into `schema` fields).

---

## 4. **Union Types (Polymorphic Schemas)**

To define polymorphic resources (e.g., events), use [Union](references/Union.md) and a discriminator field.

```typescript
import { Union } from '@data-client/rest'; // also available from @data-client/endpoint

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

## 5. Collections (Mutable Lists & Maps)

[Collections](references/Collection.md) wrap `Array` or `Values` schemas to enable mutations (add/remove/move).

### pk routing

`pk()` uses `nestKey(parent, key)` when nested in an Entity and available; otherwise it uses `argsKey(...args)`, then serializes the result. Without options, it defaults to `argsKey: params => ({ ...params })`, using all endpoint args as the collection key.

- `argsKey` — derive pk from endpoint arguments (default)
- `nestKey` — derive pk from parent entity for nested shared-state collections

Define **both** on the same `Collection` to reuse one definition top-level and nested. When `argsKey(args)` and `nestKey(parent)` produce the same object shape, the top-level fetch and the nested read resolve to the **same (referentially equal) array/map** — push/unshift/assign/move/remove on either updates both:

```ts
const userTodos = new Collection([Todo], {
  argsKey: ({ userId }: { userId?: string }) => ({ userId }),
  nestKey: (parent: User) => ({ userId: parent.id }),
});
```

### nonFilterArgumentKeys

Default `createCollectionFilter` uses `nonFilterArgumentKeys` (default: keys starting with `'order'`) to exclude non-filter args when matching collections. This affects which existing collections receive new items from `push`/`unshift`/`assign`/`move`: pushing with `{ userId: 1 }` reaches the `{}` and `{ userId: 1 }` lists, not `{ userId: 2 }`, and a list arg left out of `nonFilterArgumentKeys` (such as a sort) keeps new items out of that list.

Override as function, RegExp, or `string[]`:
```ts
new Collection([Todo], { nonFilterArgumentKeys: /orderBy|sortDir/ })
```

A plain fetch of a Collection endpoint **replaces** its contents; only the extenders below and
`getPage` add to it, so load more pages with `getPage`.

### Extenders

All usable with `ctrl.set()` (local-only) or via [RestEndpoint extenders](https://dataclient.io/rest/api/RestEndpoint) (network).

| Method | Type | Description |
|--------|------|-------------|
| `push` | Array | Entity | Append items to end |
| `unshift` | Array | Entity | Prepend items to start |
| `assign` | Values | Merge entries into map |
| `remove` | Both | Remove items by value from matching collections |
| `move` | Both | Remove from collections matching existing state, add to collections matching new state |
| `addWith(merge, filter?)` | Both | Custom creation schema (used internally by push/unshift/assign) |
| `moveWith(merge)` | Both | Custom move schema (control insertion order, e.g., `unshift` merge for prepending) |

---

## 6. Supplementary Endpoints (enrich existing entities)

When an endpoint returns partial or differently-shaped data for an entity already in cache
(e.g., a metadata endpoint, a stats endpoint, a lazy-load expansion endpoint),
use the **same Entity** as the schema — don't create a wrapper entity.

See [partial-entities](references/partial-entities.md) for patterns and examples.

---

## 7. Best Practices & Notes

- Always set up `schema` on every resource/entity/collection for normalization
- Normalize deeply nested or relational data by defining proper schemas
- Use `Entity.schema` for client-side joins
- Use `Denormalize<>` type from rest/endpoint/graphql instead of InstanceType<>. This will handle all schemas like Unions, not just Entity.

## 8. Common Mistakes to Avoid

- The normalized cache stores **plain JSON-serializable objects** (POJOs), not class instances.
- Don't forget to use `fromJS()` or assign default properties for class fields — bare TS field types emit no runtime defaults, so schema inference breaks
- Manually merging or 'enriching' data; instead use `Entity.schema` for client-side joins

# References

Vue projects: read `<name>.vue.md` instead of `<name>.md` when it exists.

For detailed API documentation, see the [references](references/) directory:

- [Entity](references/Entity.md) - Normalized data class
- [EntityMixin](references/EntityMixin.md) - Turn any class into an Entity
- [Collection](references/Collection.md) - Mutable/growable lists
- [Union](references/Union.md) - Polymorphic schemas
- [Query](references/Query.md) - Programmatic selectors
- [Invalidate](references/Invalidate.md) - Delete entities
- [Lazy](references/Lazy.md) - Deferred / circular schemas
- [Scalar](references/Scalar.md) - Lens-dependent entity fields
  - [Scalar demo](references/_ScalarDemo.md)
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
