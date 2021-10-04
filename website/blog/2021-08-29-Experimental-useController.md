---
title: Experimental useController()
authors: [ntucker]
tags: [releases, rest-hooks, packages, usecontroller, resource, fetch]
---

[@rest-hooks/experimental](https://www.npmjs.com/package/@rest-hooks/experimental) is a new
package that allows us to quickly iterate on new designs by using them in production, which provides
feedback in ways not possible at design and testing phase.

This package is **not** api stable; it does follow semver, so it will never reach 1.0.
However, it is tested with the same rigor we expect with Rest Hooks
as we use it in production. It is recommend to use this for providing feedback or playing with designs,
unless you are willing to put in extra work to make migrations. Detailed migration guides will only be
provided upon upstreaming to the mainline packages.

Today this package comes with two new features:

**[useController()](./2021-08-29-Experimental-useController.md#usecontroller)**

```ts
const { fetch, invalidate, resetEntireStore } = useController();
fetch(MyResource.detail(), { id });
```

**[Resource.list().paginated()](./2021-08-29-Experimental-useController.md#static-listpaginated)**

```ts
class NewsResource extends Resource {
  static listPage<T extends typeof NewsResource>(this: T) {
    return this.list().paginated(({ cursor, ...rest }) => [rest]);
  }
}
```

<!--truncate-->

## useController()

:::tip Update

As of 6.1 [useController()](https://resthooks.io/docs/api/useController) is now upstreamed into
Rest Hooks core packages

:::

### Usage

```tsx
import { useController } from '@rest-hooks/experimental';

function MyComponent({ id }) {
  const { fetch, invalidate, resetEntireStore } = useController();

  const handleRefresh = useCallback(
    async e => {
      await fetch(MyResource.detail(), { id });
    },
    [fetch, id],
  );

  const handleSuspend = useCallback(
    async e => {
      await invalidate(MyResource.detail(), { id });
    },
    [invalidate, id],
  );

  const handleLogout = useCallback(
    async e => {
      resetEntireStore();
    },
    [resetEntireStore],
  );
}
```

[PR](https://github.com/coinbase/rest-hooks/pull/1048)

### Motivation

- Consolidate, simplify hooks
- Consistent interface between managers and hooks
- Global referential equality available everywhere (managers and updaters)
- Simplify and consolidate TTL and error concepts
- Less code in hooks = less work on rendering leaf nodes
- Icing on cake: ez migration to EndpointInterface and flexible args support for hooks
- Future breaking changes can allow ez migration with version strings sent to `useController({version: 'v2'})`

### One hook, many endpoints

The rules of hooks are very restrictive, so the less hooks you have to call, the more flexible. This also benefits render performance. In many cases you might want to fetch many different endpoints. What's worse is if you don't know which endpoints you might want to fetch upfront. With old design you'd have to hook up every _possible_ one. This really destroys fetch-as-render pattern, as you want to be able to prefetch based on possible routes.

#### Before

```tsx
const createUser = useFetcher(User.create());
const refreshUsers = useFetcher(User.list());

return (
  <form onSubmit={() => createUser({}, userPayload)}>
    <button onClick={() => refreshUsers({})}>Refresh list</button>
  </form>
);
```

#### After

```tsx
const { fetch } = useController();

return (
  <form onSubmit={() => fetch(User.create(), {}, userPayload)}>
    <button onClick={() => fetch(User.list(), {})}>Refresh list</button>
  </form>
);
```

### Completely flexible, variable arguments

The concept of params + body for arguments was introduced to try to provide the most flexible approach in a world where type enforcement wasn't that flexible. With TypeScript 4's variadic tuples, it's now possible to strongly type arbitrary arguments to a function in a _generic_ way. Furthermore, stumbling upon package.json's typeVersions, rest hooks can now publish multiple type versions to be compatible with different versions of typescript. This allows us to eagerly adopt TypeScript 4 features, while providing a usable TypeScript 3 experience.

Some common annoyances with the current parameter limitations are single-variable arguments like detail endpoints with an id, as well as no-argument case like a list endpoint or create endpoint.

```tsx
const { fetch } = useController();

return (
  <form onSubmit={() => fetch(User.create(), userPayload)}>
    <button onClick={() => fetch(User.list())}>Refresh list</button>
  </form>
);
```

We'll also eventually bring this to the 'read' hooks like so:

```tsx
// notice username is just a string, rather than object
const user = useResource(User.detail(), username);
// here we don't need arguments
const posts = useResource(Post.list());
// but list() has it being optional, which means this also works:
const goodPosts = useResource(Post.list(), { good: true });
// postId is a number in this case
const thePost = useResource(Post.detail(), postId);
```

### Endpoint.update

By normalizing [Entities](https://resthooks.io/docs/api/Entity), Rest Hooks guarantees data integrity and consistency even down to the referential equality level. However, there are still some cases where side effects result in changes to the actual results themselves. The most common reason for this is creation of new entities. While 'creation' is almost universally the cause for this (as deletion is handled more simply by delete schemas), the structure of data and where created elements go is not universal.

:::tip

**Start using this now!** Though this is the only way to use the new Controller.fetch,
endpoints with `update` work with the old [useFetcher()](https://resthooks.io/docs/api/useFetcher) hook as well.

:::

#### Before

Previously this was enabled by an optional third argument to the fetch [UpdateParams](https://resthooks.io/docs/api/useFetcher#updateparams-destendpoint-destparams-updatefunction) enabling programmatic changes that are also strictly type enforced to ensure the data integrity of the Rest Hooks store.

```typescript
const createUser = new Endpoint(postToUserFunction, {
  schema: User,
});

const createUser = useFetcher(createUser);

createUser({}, { id: 1 }, [
  [
    userList,
    {},
    (newUserID: string, userIDs: string[] | undefined) => [
      ...(userIDs || []),
      newUserID,
    ],
  ],
]);
```

While simple, this design had several shortcomings

- Only operates on the normalized results, often arrays of strings
  - This is non-intuitive as this doesn't relate directly to the data's form and requires understanding of internals
  - Code is confusing with two ordered args and necessary default handling
- Is provided as an argument to the fetch rather than endpoint
  - Makes variable arguments impossible, and hard to reason about
  - Makes pattern reuse still require explicit wiring
  - Was thought to be more flexible than in 'fetchshape', as it has access to local variables in its event handler. However, Endpoints's can easily use `.extend()` to contextually override so this feature is moot.
  - Encourages antipatterns like writing hooks for specific endpoints

#### After

- Move to Endpoint
- builder pattern to make updater definition easy
  - typeahead
  - strong type enforcement
  - much more readable than a size 3 tuple

Simplest case:

```ts title="userEndpoint.ts"
const createUser = new Endpoint(postToUserFunction, {
  schema: User,
  update: (newUserId: string) => ({
    [userList.key()]: (users = []) => [newUserId, ...users],
  }),
});
```

More updates:

```typescript title="Component.tsx"
const allusers = useResource(userList);
const adminUsers = useResource(userList, { admin: true });
```

The endpoint below ensures the new user shows up immediately in the usages above.

```ts title="userEndpoint.ts"
const createUser = new Endpoint(postToUserFunction, {
  schema: User,
  update: (newUserId, newUser)  => {
    const updates = {
      [userList.key()]: (users = []) => [newUserId, ...users],
    ];
    if (newUser.isAdmin) {
      updates[userList.key({ admin: true })] = (users = []) => [newUserId, ...users];
    }
    return updates;
  },
});
```

This is usage with a [Resource](https://resthooks.io/docs/api/Resource)

```typescript title="TodoResource.ts"
import { Resource } from '@rest-hooks/rest';

export default class TodoResource extends Resource {
  readonly id: number = 0;
  readonly userId: number = 0;
  readonly title: string = '';
  readonly completed: boolean = false;

  pk() {
    return `${this.id}`;
  }

  static urlRoot = 'https://jsonplaceholder.typicode.com/todos';

  static create<T extends typeof Resource>(this: T) {
    const todoList = this.list();
    return super.create().extend({
      schema: this,
      // highlight-start
      update: (newResourceId: string) => ({
        [todoList.key({})]: (resourceIds: string[] = []) => [
          ...resourceIds,
          newResourceId,
        ],
      }),
      // highlight-end
    });
  }
}
```

### Resolution order

This makes little difference in React 18 since renders are batched; however in React < 18, this means that code after promise resolution will be executed before react renders - allowing actions that need to take place as a result of successful fetch. For example navigating off a deleted page after delete.

```typescript
const handleDelete = useCallback(
  async e => {
    await fetch(MyResource.delete(), { id });
    history.push('/');
  },
  [fetch, id],
);
```

:::warning

It's now recommended to wrap all fetches in act when testing like so:

```ts
await act(async () => {
  await result.current.fetch(ComplexResource.detail(), {
    id: '5',
  });
});
```

:::

[PR](https://github.com/coinbase/rest-hooks/pull/1046)

### What's Next

Tentative plans look something like this:

```ts
const controller = useController();

// actions
controller.fetch(UserResource.detail(), { id }); // sideEffects means no throttle, otherwise throttle
controller.receive(payload, UserResource.detail(), { id });
controller.invalidate(UserResource.detail(), { id });
controller.resetEntireStore();
controller.subscribe(UserResource.detail(), { id });
controller.unsubscribe(UserResource.detail(), { id });
// posisble new
controller.abort(UserResource.detail(), { id }); // only aborts if in flight
// note: to force fetch of sideEffect: undefined - call abort first
// this should enable good offline/online managers

// retrieval
const state = useContext(StateContext);
const [value, expiresAt] = controller.getResponse(
  state,
  UserResource.detail(),
  { id },
);
const error = controller.getError(state, UserResource.detail(), { id });
```

## Resource changes

### static list().paginated()

#### Motivation

<!--
Does this solve a bug? Enable a new use-case? Improve an existing behavior? Concrete examples are helpful here.
-->

Pagination is a common scenario, that would benefit from minimal specification.

#### Solution

<!--
What is the solution here from a high level. What are the key technical decisions and why were they made?
-->

By default we rely on finding a list within the schema. The only remaining thing is figuring out how to extract the 'cursor' args to update the main list. Therefore, a function to do just that should be provided by the user like so.

```ts
class NewsResource extends Resource {
  static listPage<T extends typeof NewsResource>(this: T) {
    return this.list().paginated(({ cursor, ...rest }) => [rest]);
  }
}
```

```tsx
import { useResource } from 'rest-hooks';
import NewsResource from 'resources/NewsResource';

function NewsList() {
  const { results, cursor } = useResource(NewsResource.list(), {});
  const curRef = useRef(cursor);
  curRef.current = cursor;
  const fetch = useFetcher();
  const getNextPage = useCallback(
    () => fetch(NewsResource.listPage(), { cursor: curRef.current }),
    [],
  );

  return (
    <Pagination onPaginate={getNextPage} nextCursor={cursor}>
      <NewsList data={results} />
    </Pagination>
  );
}
```

[PR](https://github.com/coinbase/rest-hooks/pull/868)

### New Hiearchy

Not every Resource has the same endpoints. It may have additional methods to CRUD, or
it could only support some operations. Furthermore, the exact nature and typings of endpoints
could vary widely making it hard to define a good base class, while also providing very specific types.

That's why there is a new `BaseResource` that includes everything Resource had, but with
absolutely no endpoints. Instead it comes with an extensible 'abstract endpoint' BaseResource.endpoint()
for side-effect free endpoints, as well as BaseResource.endpointMutate().

`Resource` is still provided, by simplying extending one of these endpoints like so

```typescript
abstract class Resource extends BaseResource {
  /** Endpoint to get a single entity */
  static detail<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    (this: RestEndpoint, params: any) => Promise<any>,
    SchemaDetail<AbstractInstanceType<T>>,
    undefined
  > {
    const endpoint = this.endpoint();
    return this.memo('#detail', () =>
      endpoint.extend({
        schema: this,
      }),
    );
  }
  // etc
}
```

This should make it much easier to get started quickly, while allowing for a powerful yet flexible
options in `BaseResource`. We expect most medium-to-large applications to mostly use this class.

[PR](https://github.com/coinbase/rest-hooks/pull/841)
