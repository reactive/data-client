---
'@data-client/test': patch
---

Interceptors that have args specified will still work, and warn about args.

Example:

```typescript
{
  endpoint: TodoResource.getList.push,
  args: [{ userId: '5' }, {}],
  response({ userId }, body) {
    return { id: Math.random(), userId, ...ensurePojo(body) };
  },
}
```

This is clearly an interceptor, but args were accidentally specified. Before
this would make it not register, and TypeScript couldn't detect the issue.

Now this is treated as an interceptor (args ignored); and there is a console warning