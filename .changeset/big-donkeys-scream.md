---
"@data-client/react": patch
---

Hooks arg-typechecking accuracy improved

For example string literals now work:

```ts
const getThing= new Endpoint(
  (args: { postId: string | number; sortBy?: 'votes' | 'recent' }) =>
    Promise.resolve({ a: 5, ...args }),
  { schema: MyEntity },
);

const myThing = useSuspense(getThing, {
  postId: '5',
  sortBy: 'votes',
});
```