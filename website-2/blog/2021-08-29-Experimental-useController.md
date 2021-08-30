---
title: Experimental useController()
authors: [ntucker]
tags: [releases, rest-hooks, packages, usecontroller, resource, fetch]
---

[@rest-hooks/experimental](https://www.npmjs.com/package/@rest-hooks/experimental) is a new
package that allows us to quickly iterate on new designs by using them in production, which provides
feedback in ways not possible at design and testing phase.

This package is **not** api stable. However, it is tested with the same rigor we expect with Rest Hooks
as we use it in production. It is recommend to use this for providing feedback or playing with designs,
unless you are willing to put in extra work to make migrations. Detailed migration guides will only be
provided upon upstreaming to the mainline packages.

Today this package comes with two new features:

**[useController()](#usecontroller)**

```ts
const { fetch, invalidate, resetEntireStore } = useController();
fetch(MyResource.detail(), { id });
```

**[Resource.list().paginated()](#resourcelistpaginated)**

```ts
class NewsResource extends Resource {
  static listPage<T extends typeof NewsResource>(this: T) {
    return this.list().paginated(({ cursor, ...rest }) => [rest]);
  }
}
```

<!--truncate-->

## useController()

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
const createArticle = useFetcher(ArticleResource.create());

createArticle({}, { id: 1 }, [
  [
    ArticleResource.list(),
    {},
    (newArticleID: string, articleIDs: string[] | undefined) => [
      ...(articleIDs || []),
      newArticleID,
    ],
  ],
]);
```

While simple, this design had several shortcomings

- Only operates on the normalized results, often arrays of strings
  - This is non-intuitive as this doesn't relate directly to the data's form and requires understanding of internals
  - Code is confusing with two ordered args and necessary default handling
  - Lack of access to entities means sorting is not possible
  - Can only update top level results, which means lists nested inside entities cannot be updated
- Is provided as an argument to the fetch rather than endpoint
  - Makes variable arguments impossible, and hard to reason about
  - Makes pattern reuse still require explicit wiring
  - Was thought to be more flexible than in 'fetchshape', as it has access to local variables in its event handler. However, Endpoints's can easily use `.extend()` to contextually override so this feature is moot.
  - Encourages antipatterns like writing hooks for specific endpoints

#### After

- Operate on the actual denormalized form - that is the same shape that is consumsed with a useResource()
- Move to Endpoint
- Take the denormalized response as arg to first function
- builder pattern to make updater definition easy
  - typeahead
  - strong type enforcement
  - much more readable than a size 3 tuple

Simplest case:

```typescript
type UserList = Denormalized<typeof userList['schema']>;

const createUser = new Endpoint(postToUserFunction, {
  schema: User,
  update: (newUser: Denormalize<S>) => [
    userList.bind().updater((users: UserList = []) => [newUser, ...users]),
  ],
});
```

More updates:

<details open><summary><b>Component.tsx</b></summary>

```typescript
const allusers = useResource(userList);
const adminUsers = useResource(userList, { admin: true });
const sortedUsers = useResource(userList, { sortBy: 'createdAt' });
```

</details>

The endpoint below ensures the new user shows up immediately in the usages above.

<details open><summary><b>userEndpoint.ts</b></summary>

```typescript
const createUser = new Endpoint(postToUserFunction, {
  schema: User,
  update: (newUser: Denormalize<S>)  => {
    const updates = [
      userList.bind().updater((users = []) => [newUser, ...users]),
      userList.bind({ sortBy: 'createdAt' }).updater((users = [], { sortBy }) => {
        const ret = [createdUser, ...users];
        ret.sortBy(sortBy);
        return ret;
      },
    ];
    if (newUser.isAdmin) {
      updates.push(userList.bind({ admin: true }).updater((users = []) => [newUser, ...users]));
    }
    return updates;
  },
});
```

</details>

#### Extracting patterns

In case more than one other endpoint might result in updating our list endpoint, we can centralize the logic of how that should work in our updated endpoint.

```typescript
const userList = new Endpoint(getUsers, {
  schema: User[],
  addUserUpdater: (this: Endpoint, newUser: User) => this.updater((users = []) => [newUser, ...users]),
});
```

```typescript
const createUser = new Endpoint(postToUserFunction, {
  schema: User,
  update: (newUser: Denormalize<S>) => [
    userList.bind({ admin: true }).addUserUpate(newUser),
    userList.bind({}).addUserUpate(newUser),
  ],
});
```

<details open><summary><b>Alternate Ideas - The programmatic approach</b></summary>

#### The no guarantees

```typescript
const createUser = new Endpoint(postToUserFunction, {
  schema: User,
  update: (newUser: Denormalize<S>, state: State<unknown>) => {
    return {
      ...state,
      results: {
        ...state.results,
       [userList.key({ admin: true })]: [newUser.pk(), ...state.results[userList.key({ admin: true })]],
       [userList.key({ })]: [newUser.pk(), ...state.results[userList.key({ })]],
     }
    }
  }
}
```

#### Store Adapter

```typescript
const createUser = new Endpoint(postToUserFunction, {
  schema: User,
  update: (newUser: Denormalize<S>, store: Store) => {
    const prependUser = (users = []) => [newUser, ...users]
    if (newUser.isAdmin) {
      store = store.set(
         userList.bind({admin: true}),
         prependUser
      );
    }
    store = store.set(
       userList.bind({}),
       prependUser
    );
    return store;
  }
}
```

```typescript
const createUser = new Endpoint(postToUserFunction, {
  schema: User,
  update: (newUser: Denormalize<S>, store: Store) => {
    // this actually goes through every current result based on this endpoint
    // however it does not update extremely stale results for performance reasons
    store.get(userList).mapItems((key: string, users: User[]) => {
      if (!key.includes('admin') || newUser.isAdmin) {
        return [newUser, ...users];
      }
    });
  }
}
```

Another idea is to make an updater callback with identical API to [manager middleware](https://resthooks.io/docs/api/Manager#getmiddleware). We would probably want to minimize chaining actions, so some way of consolidating into one action would be preferable. Adding an adapter to raw state might be good for Manager's as well, so designing this interface could be beneficial to optionally improving middleware interfaces.

</details>

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

## Resource.list().paginated()

### Motivation
<!--
Does this solve a bug? Enable a new use-case? Improve an existing behavior? Concrete examples are helpful here.
-->
Pagination is a common scenario, that would benefit from minimal specification.

### Solution
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
    []
  );

  return (
    <Pagination onPaginate={getNextPage} nextCursor={cursor}>
      <NewsList data={results} />
    </Pagination>
  );
}
```

[PR](https://github.com/coinbase/rest-hooks/pull/868)
