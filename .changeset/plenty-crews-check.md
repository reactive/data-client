---
"@data-client/endpoint": minor
"@data-client/rest": minor
"@data-client/graphql": minor
---

BREAKING CHANGE: Remove new AbortOptimistic() in favor of [snapshot.abort](https://dataclient.io/docs/api/Snapshot#abort)


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