---
"@data-client/endpoint": minor
"@data-client/rest": minor
"@data-client/graphql": minor
---

BREAKING: useCache(new Index(MyEntity)) -> useQuery(MyEntity)

#### Before

```jsx
const UserIndex = new Index(User)

const bob = useCache(UserIndex, { username: 'bob' });
```

#### After

```jsx
const bob = useQuery(User, { username: 'bob' });
```