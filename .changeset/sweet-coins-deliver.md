---
"@data-client/react": minor
"@data-client/core": minor
---

Add [controller.get](https://dataclient.io/docs/api/Controller#get) / [snapshot.get](https://dataclient.io/docs/api/Snapshot#get) to directly read [Querable Schemas](https://dataclient.io/docs/api/useQuery#queryable)

#### Before

```tsx
export const PostResource = createResource({
  path: '/posts/:id',
  schema: Post,
}).extend(Base => ({
  vote: new RestEndpoint({
    path: '/posts/:id/vote',
    method: 'POST',
    body: undefined,
    schema: Post,
    getOptimisticResponse(snapshot, { id }) {
      const { data } = snapshot.getResponse(Base.get, { id });
      if (!data) throw new AbortOptimistic();
      return {
        id,
        votes: data.votes + 1,
      };
    },
  }),
}));
```

#### After

```tsx
export const PostResource = createResource({
  path: '/posts/:id',
  schema: Post,
}).extend('vote',
  {
    path: '/posts/:id/vote',
    method: 'POST',
    body: undefined,
    schema: Post,
    getOptimisticResponse(snapshot, { id }) {
      const post = snapshot.get(Post, { id });
      if (!post) throw new AbortOptimistic();
      return {
        id,
        votes: post.votes + 1,
      };
    },
  },
);
```
