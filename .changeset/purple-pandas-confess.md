---
"@data-client/react": minor
---

Add [useQuery()](https://dataclient.io/docs/api/useQuery) to render [Querable Schemas](https://dataclient.io/docs/api/useQuery#queryable)

```ts
class User extends Entity {
  username = '';
  id = '';
  groupId = '';
  pk() {
    return this.id;
  }
  static index = ['username' as const];
}

const bob = useQuery(User, { username: 'bob' });
```

```ts
const getUserCount = new schema.Query(
  new schema.All(User),
  (entries, { isAdmin } = {}) => {
    if (isAdmin !== undefined)
      return entries.filter(user => user.isAdmin === isAdmin).length;
    return entries.length;
  },
);

const userCount = useQuery(getUserCount);
const adminCount = useQuery(getUserCount, { isAdmin: true });
```

```ts
const UserCollection = new schema.Collection([User], {
  argsKey: (urlParams: { groupId?: string }) => ({
    ...urlParams,
  }),
});

const usersInGroup = useQuery(UserCollection, { groupId: '5' });
```