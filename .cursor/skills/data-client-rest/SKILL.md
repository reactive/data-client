---
name: data-client-rest
description: Define REST APIs with @data-client/rest - resource(), RestEndpoint, CRUD, GET/POST/PUT/DELETE, HTTP fetch, normalize, cache, urlPrefix, path parameters
license: Apache 2.0
---
# Guide: Using `@data-client/rest` for Resource Modeling

This project uses [@data-client/rest](https://dataclient.io/rest) to define, fetch, normalize, and update RESTful resources and entities in React/TypeScript apps with type safety and automatic cache management.  
**Always follow these patterns when generating code that interacts with remote APIs.**

---

## 1. Defining Schemas

This project uses [schemas](references/schema.md) to define and normalize data models with type safety and automatic cache management. Apply the skill "data-client-schema" for schema patterns.
**Always follow these patterns (apply the skill "data-client-schema") when generating mutable data definitions.**

## 2. Resources (`resource()`)

- [resource()](references/resource.md) creates a collection of [RestEndpoints](references/RestEndpoint.md) for CRUD operations on a common object
- Required fields:
  - `path`: path‑to‑regexp template (typed!)
  - `schema`: Declarative data shape for a **single** item (typically Entity or Union)
- Optional:
  - `urlPrefix`: Host root, if not `/`
  - `searchParams`: Type for query parameters (TS generic) in MyResource.getList
  - `paginationField`: Add MyResource.getList.getPage for pagination
  - `optimistic`: Boolean, when true all mutations will update optimistically, improving performance
  - `body`: Type for body parameter to MyResource.getList.push, MyResource.getList.unshift, MyResource.update, MyResource.partialUpdate

```ts
import { Entity, resource } from '@data-client/rest';
import { User } from './User';

export class Todo extends Entity {
  id = 0;
  user = User.fromJS();
  title = '';
  completed = false;
  createdAt = new Date();

  static key = 'Todo';
  static schema = {
    user: User,
    createdAt: (iso: string) => new Date(iso),
  }
}

export const TodoResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
  searchParams: {} as { userId?: string | number } | undefined,
  paginationField: 'page',
  optimistic: true,
});
```

### Usage

#### [Rendering](references/data-dependency.md)

```ts
// GET https://jsonplaceholder.typicode.com/todos/5
const todo = useSuspense(TodoResource.get, { id: 5 });
// GET https://jsonplaceholder.typicode.com/todos
const todoList = useSuspense(TodoResource.getList);
// GET https://jsonplaceholder.typicode.com/todos?userId=1
const todoListByUser = useSuspense(TodoResource.getList, { userId: 1 });
```

#### [Mutations](references/mutations.md)

```ts
const ctrl = useController();
// PUT https://jsonplaceholder.typicode.com/todos/5
const updateTodo = todo => ctrl.fetch(TodoResource.update, { id }, todo);
// PATCH https://jsonplaceholder.typicode.com/todos/5
const partialUpdateTodo = todo =>
  ctrl.fetch(TodoResource.partialUpdate, { id }, todo);
// POST https://jsonplaceholder.typicode.com/todos
const addTodoToStart = todo =>
  ctrl.fetch(TodoResource.getList.unshift, todo);
// POST https://jsonplaceholder.typicode.com/todos?userId=1
const addTodoToEnd = todo => ctrl.fetch(TodoResource.getList.push, { userId: 1 }, todo);
// PATCH https://jsonplaceholder.typicode.com/todos/5
const toggleStatus = (completed: boolean) => ctrl.fetch(TodoResource.getList.move, { id }, { completed });
// DELETE https://jsonplaceholder.typicode.com/todos/5
const deleteTodo = id => ctrl.fetch(TodoResource.delete, { id });
// GET https://jsonplaceholder.typicode.com/todos?userId=1&page=2
const getNextPage = (page) => ctrl.fetch(TodoResource.getList.getPage, { userId: 1, page })
```

For more detailed usage, apply the skill "data-client-react" or "data-client-vue".

---

## 3. Custom [RestEndpoint](references/RestEndpoint.md) patterns

```ts
/** Stand‑alone endpoint with custom typing */
export const getTicker = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:product_id/ticker',
  schema: Ticker,
  pollFrequency: 2000,
});
```

**Typing tips**  
- `path` path‑to‑regexp template for 1st arg
- `method` ≠ `GET` ⇒ 2nd arg = body (unless `body: undefined`)
- Provide `searchParams` / `body` _values_ purely for **type inference**
- Use `RestGenerics` when inheriting from `RestEndpoint`

### getOptimisticResponse()

```ts
getOptimisticResponse(snap, { id }) {
  const article = snap.get(Article, { id });
  if (!article) throw snap.abort;
  return {
    id,
    votes: article.votes + 1,
  };
}
```

---

### 4. RestEndpoint lifecycle methods

- **Perform Fetch:** `fetchResponse()` → `parseResponse()` → `process()`
  - **url(urlParams):** `urlPrefix` + `path` + (`searchParams` → `searchToString()`)
  - **getRequestInit(body):** `getHeaders()` + `method` + `signal`

---

## 5. **Extending Resources**

Use `.extend()` to add or override endpoints.

```typescript
export const IssueResource = resource({
  // ...base config...
}).extend((Base) => ({
  search: Base.getList.extend({
    path: '/search/issues',
    // ...custom schema or params...
  }),
}));
```

---

## 6. Best Practices & Notes

- When asked to browse or navigate to a web address, actual visit the address
- Always set up `schema` on every resource/entity/collection for normalization
- Prefer `RestEndpoint` over `resource()` for defining single endpoints or when mutation endpoints don't exist

## 7. Common Mistakes to Avoid

- Don't use `resource()` when mutation endpoints are not used or needed

# References

For detailed API documentation, see the [references](references/) directory:

- [resource](references/resource.md) - Create CRUD endpoints
- [RestEndpoint](references/RestEndpoint.md);[_EndpointLifecycle.mdx](references/_EndpointLifecycle.mdx);[RestEndpoint.js](references/RestEndpoint.js) - Single REST endpoint
- [Entity](references/Entity.md);[_entity_lifecycle_methods.mdx](references/_entity_lifecycle_methods.mdx) - Normalized data class
- [Collection](references/Collection.md) - Mutable lists
- [schema](references/schema.md) - Schema overview
- [Fixtures](references/Fixtures.md) - Mock data for testing
- [data-dependency](references/data-dependency.md);[_useLive.mdx](references/_useLive.mdx);[_AsyncBoundary.mdx](references/_AsyncBoundary.mdx) - Rendering guide
- [mutations](references/mutations.md);[_useLoading.mdx](references/_useLoading.mdx);[_VoteDemo.mdx](references/_VoteDemo.mdx) - Mutations guide

**Guides** (refer when user asks about these topics):
- [auth](references/auth.md) - Authentication headers, tokens, login/logout flows
- [pagination](references/pagination.md);[_pagination.mdx](references/_pagination.mdx) - Cursor/offset pagination, infinite scroll
- [optimistic-updates](references/optimistic-updates.md);[_optimisticTransform.mdx](references/_optimisticTransform.mdx) - Instant UI feedback before server response
- [network-transform](references/network-transform.md) - Transform responses, handle non-standard APIs

**Concepts** (refer when user asks about these topics):
- [expiry-policy](references/expiry-policy.md) - Cache invalidation, stale data, dataExpiryLength, errorExpiryLength
- [error-policy](references/error-policy.md) - Error handling, retry behavior, soft vs hard errors

**ALWAYS follow these patterns and refer to the official docs for edge cases. Prioritize code generation that is idiomatic, type-safe, and leverages automatic normalization/caching via schema definitions.**
