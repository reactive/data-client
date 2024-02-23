---
"@data-client/endpoint": minor
"@data-client/rest": minor
"@data-client/graphql": minor
---

BREAKING: new Query -> [new schema.Query](https://dataclient.io/rest/api/Query)

#### Before

```jsx
const getUserCount = new Query(
  new schema.All(User),
  (entries, { isAdmin } = { }) => {
    if (isAdmin !== undefined)
      return entries.filter(user => user.isAdmin === isAdmin).length;
    return entries.length;
  },
);

const userCount = useCache(getUserCount);
const adminCount = useCache(getUserCount, { isAdmin: true });
```

#### After

```jsx
const getUserCount = new schema.Query(
  new schema.All(User),
  (entries, { isAdmin } = { }) => {
    if (isAdmin !== undefined)
      return entries.filter(user => user.isAdmin === isAdmin).length;
    return entries.length;
  },
);

const userCount = useQuery(getUserCount);
const adminCount = useQuery(getUserCount, { isAdmin: true });
```