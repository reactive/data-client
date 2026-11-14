---
name: data-client-schema
description: Model the app's data with @data-client schemas, which normalize responses into one shared cache so an update shows everywhere. Use it whenever an endpoint returning data is added or its response changes (resource, RestEndpoint, GraphQL, Endpoint), when the data's shape changes, when data from different endpoints must be joined or related, when deriving views from loaded data, or when one item looks different in two places. Covers Entity, GQLEntity, Collection, Union and Query.
license: Apache 2.0
---

## 1. Defining Schemas

Compose [schemas](references/schema.md) to match the JSON an endpoint returns. Import them from the protocol package
the app uses (`@data-client/rest`, `@data-client/graphql` or `@data-client/endpoint`; both protocol packages re-export
endpoint). For GraphQL, extend `GQLEntity` instead of `Entity`; it declares the `id` field used as `pk()`.

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

- [new Scalar({ lens, key, entity? })](references/Scalar.md) - fields that vary by runtime lens (portfolio, currency, locale) without entity mutation ([demo](references/_ScalarDemo.md))

### Derived / selector pattern

- [new Query(Queryable)](references/Query.md) - memoized programmatic selectors
  ```ts
  const queryRemainingTodos = new Query(
    TodoResource.getList.schema,
    entries => entries.filter(todo => !todo.completed).length,
  );
  ```

  `useQuery(query, ...args)` passes `args` to the schema too. `getList.schema` is the list fetched with those
  same args, so `useQuery(query, { userId })` finds nothing unless `getList({ userId })` was fetched. To filter
  by an arg the list was not fetched with, query every stored entity:
  ```ts
  const queryTodosByUser = new Query(
    new All(Todo),
    (todos, { userId }: { userId: string }) => todos.filter(todo => todo.userId === userId),
  );
  ```

  Define `Query` transformations with the data model (e.g. `src/resources/`) — not inside custom hooks
  wrapping useSuspense/useQuery, which hides data dependencies and couples data logic to view code.

## 2. Entity best practices

- Every `Entity` subclass **defines defaults** for _all_ non-optional serialised fields: bare TS field types emit no
  runtime value, so schema inference breaks.
- Override `pk()` only when the primary key ≠ `id`. It must read top-level fields, since it also runs on lookup args
  and delete params, which usually hold only the key: copy a nested key (`{ post: { id } }`) to `id` in `process()` instead ([example](references/Entity.md#primary-key-in-a-nested-object))
- [`static indexes = ['username' as const]`](references/Entity.md#indexes) to look up by a unique non-pk field with `useQuery(User, { username })`, instead of building lookup `Map`s
- `pk()` return type is `number | string | undefined`
- Override `Entity.process(value, parent, key, args)` to adapt input before normalizing, e.g. add fields from
  args/url, or turn an API's stand-in for a missing nested entity (like `{}`) into `undefined`
  ([example](references/Entity.md#optional-members)). `parent` and `key` say where the entity was nested
- `static schema` (optional) for nested schemas or deserialization functions; it also joins related entities
  client-side, so never merge or 'enrich' data by hand: no lookup `Map`, `find()` per row or stitching in a
  component ([Relationships](#relationships) has the recipe for each API shape)
  - When designing APIs, prefer nesting entities

## 3. Entity lifecycle methods

- **Normalize** (JSON response → cache): operates on POJOs; output is JSON-serializable plain data stored in the normalized cache. Order: `process()` → `pk()` → [validate()](references/validation.md) → **visit nested schemas** (recurse into `schema` fields) → if existing: `mergeWithStore()` which calls `shouldUpdate()` and maybe `shouldReorder()` + `merge()`; metadata via `mergeMetaWithStore()`.
- **Older data arriving after newer** (a poll, slow request or embedded copy): override [`shouldReorder(existingMeta, incomingMeta, existing, incoming)`](references/Entity.md#shouldreorder) to compare a version field such as `updatedAt`; that alone keeps the newer fields. `shouldUpdate()` is for skipping updates to save work.
- **Denormalize** (cache → component): creates Entity **class instances** via `fromJS()`, restoring prototype chain so getters, methods, and `schema` processing work. Order: `createIfValid()` → [validate()](references/validation.md) → `fromJS()` → **unvisit nested schemas** (recurse into `schema` fields).

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

Use each as an endpoint's `schema` (network; `resource()` exposes them as `getList.push` etc.) or with `ctrl.set()`
(local-only).

| Method | Type | Description |
|--------|------|-------------|
| `push` | Array \| Entity | Append items to end |
| `unshift` | Array \| Entity | Prepend items to start |
| `assign` | Values | Merge entries into map |
| `remove` | Both | Remove items by value from matching collections |
| `move` | Both | Remove from collections matching existing state, add to collections matching new state |
| `addWith(merge, filter?)` | Both | Custom creation schema (used internally by push/unshift/assign) |
| `moveWith(merge)` | Both | Custom move schema (control insertion order, e.g., `unshift` merge for prepending) |

## 6. Supplementary Endpoints (enrich existing entities)

When an endpoint returns partial or differently-shaped data for an entity already in cache
(e.g., a metadata endpoint, a stats endpoint, a lazy-load expansion endpoint),
use the **same Entity** as the schema — don't create a wrapper entity.

See [partial-entities](references/partial-entities.md) for patterns and examples, including a list endpoint that
returns fewer fields than the detail endpoint.

## 7. Gotchas

- An endpoint without `schema` bypasses normalization: its data is never updated by other endpoints' responses or
  `ctrl.set()`.
- Type responses with `Denormalize<typeof schema>`, not `InstanceType<>`; it handles every schema (Union, Collection),
  not just Entity.

# References

Vue projects: read `<name>.vue.md` instead of `<name>.md` when it exists.

Each guide holds a complete working example: the API response, the schema and the component. Find the row
that matches the task and read that section before writing code.

## Relationships

All in [relational-data](references/relational-data.md):

| Situation | Section | Technique |
|---|---|---|
| A response embeds related objects (a post with its `author` and `comments`) | "Nesting" | name each nested Entity in `static schema` |
| A response has only the id of a related object that another endpoint returns (`userId`, `author_id`) | "Client side joins" | `process()` copies the id to a field that `static schema` maps to the other Entity |
| A response has a parent's list: an endpoint returns it (`GET /posts?userId=1`) or the parent nests it (`user.posts`), and creates, deletes or moves must keep it current | [Collections](#5-collections-mutable-lists--maps) above, not "Reverse lookups" | `new Collection([Post], { argsKey, nestKey })` with `push`/`remove`/`move`; no custom `merge()`, since each fetch replaces the list |
| No response has the other side of a relationship: a user's posts when only posts embed their author, a comment's post, any parent's children or child's parent | "Reverse lookups" | the nested entity's `process(value, parent, key)` stores the parent's id; `merge()` joins the id lists. If the link can change (a post gets a new author), a `Query` over `All` instead |
| Two Entity classes refer to each other: circular import, class used before it is defined | "Circular dependencies" | set `A.schema` after both classes exist; `import type` in one direction |

## Other use cases

| Use case | Read | Technique |
|---|---|---|
| A value computed from one entity's own fields (full name, line total) | "Singular computations" in [computed-properties](references/computed-properties.md) | a getter on the Entity |
| A value computed across many entities (cart total, unread count, grouping) | "Global computations" in [computed-properties](references/computed-properties.md) | a `Query`, read with `useQuery()` |
| List items have fewer fields than the detail endpoint; a detail page opened from the list shows blanks or never fetches | [partial-entities](references/partial-entities.md) | summary and full classes share `static key`; `validateRequired()` on the full one |
| A mutation changes more than its own entity (a trade also changes the account balance) | [side-effects](references/side-effects.md) | the response returns every changed entity and the endpoint's `schema` names each; not `expireAll()` |
| A server-sorted list must stay sorted after a create, or the client sorts by a column | [sorting-client-side](references/sorting-client-side.md) | the endpoint's `schema` is a `Query` that sorts its `Collection` |
| A wrong or incomplete response must fail instead of rendering defaults | [validation](references/validation.md) | `static validate()` |
