---
"@data-client/normalizr": minor
"@data-client/react": minor
"@data-client/core": minor
---

Add [snapshot.abort](https://dataclient.io/docs/api/Snapshot#abort)

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