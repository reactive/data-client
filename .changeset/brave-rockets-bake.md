---
"@data-client/normalizr": minor
"@data-client/endpoint": minor
"@data-client/react": minor
"@data-client/core": minor
"@data-client/rest": minor
"@data-client/graphql": minor
---

BREAKING: new AbortOptimistic() -> [snapshot.abort](https://dataclient/docs/api/Snapshot#abort)

#### Before

```ts
getOptimisticResponse(snapshot, { id }) {
  const { data } = snapshot.getResponse(Base.get, { id });
  if (!data) throw new AbortOptimistic();
  return {
    id,
    votes: data.votes + 1,
  };
}
```

#### After

```ts
getOptimisticResponse(snapshot, { id }) {
  const { data } = snapshot.getResponse(Base.get, { id });
  if (!data) throw snapshot.abort;
  return {
    id,
    votes: data.votes + 1,
  };
}
```