---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Explain skipped optimistic updates in development

When [getOptimisticResponse()](https://dataclient.io/rest/api/RestEndpoint#getoptimisticresponse) throws, or returns a value its schema can't normalize, the UI waits for the server instead of updating right away. The console error now starts with `Optimistic update skipped for <endpoint>` and says what to fix. It is logged once per mutation, instead of again on every store update until the server responds.

The most common cause is an Entity without its primary key. Other fields can be left out; they keep their cached values. When the endpoint's arguments don't include the key, read it from the snapshot:

```ts
const updateProfile = new RestEndpoint({
  path: '/users/profile',
  method: 'PATCH',
  body: {} as { firstName: string; bio: string },
  schema: User,
  getOptimisticResponse(snap, body) {
    // before: return body; (no id, so the optimistic update was skipped)
    const { data: user } = snap.getResponse(getMe);
    if (!user) throw snap.abort;
    return { id: user.id, ...body };
  },
});
```
