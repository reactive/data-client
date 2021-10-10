# Experimental extensions for Rest Hooks

[![CircleCI](https://circleci.com/gh/coinbase/rest-hooks/tree/master.svg?style=shield)](https://circleci.com/gh/coinbase/rest-hooks)
[![Coverage Status](https://img.shields.io/codecov/c/gh/coinbase/rest-hooks/master.svg?style=flat-square)](https://app.codecov.io/gh/coinbase/rest-hooks?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/@rest-hooks/experimental.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/experimental)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@rest-hooks/experimental?style=flat-square)](https://bundlephobia.com/result?p=@rest-hooks/experimental)
[![npm version](https://img.shields.io/npm/v/@rest-hooks/experimental.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/experimental)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

<div align="center">

**[📖Read The Docs](https://resthooks.io)**

</div>

## Motivation

Field application of designs help smooth edges of a theoretical design. New designs can be iterated on here, breaking freely without worry of legacy support plans.

## Usage

### useController()

```tsx
const controller = useController();

return (
  <form onSubmit={() => controller.fetch(User.create(), userPayload)}>
    <button onClick={() => controller.fetch(User.list())}>Refresh list</button>
    <button onClick={() => controller.invalidate(User.list())}>Suspend list</button>
  </form>
);
```

### Endpoint.update

<details open><summary><b>Simple</b></summary>

```typescript
const createUser = new Endpoint(postToUserFunction, {
  schema: User,
  update: (newUserId: string) => ({
    [userList.key({})]: (users = []) => [newUserId, ...users],
  }),
});
```

</details>

<details><summary><b>Multiple updates</b></summary>

```typescript
const createUser = new Endpoint(postToUserFunction, {
  schema: User,
  update: (newUserId: string, newUser: User)  => {
    const updates = {
      [userList.key()]: (users = []) => [newUserId, ...users],
      [userList.key({ sortBy: 'createdAt' })]: (users = [], { sortBy }) => {
        const ret = [newUserId, ...users];
        ret.sortBy(sortBy);
        return ret;
      },
    ];
    if (newUser.isAdmin) {
      updates[userList.key({ admin: true })] = (users = []) => [newUserId, ...users];
    }
    return updates;
  },
});
```

</details>


### Entity, EntityRecord, Resource, BaseResource

- Normalizes to pojo
- Faster
- Entity has no defined key lookups - but EntityRecord does.
- BaseResource is missing predefined endpoints (list, detail, etc), but has everything else


### Resource.list() declarative pagination

Addition of `paginated()`.


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
