---
'@data-client/react': minor
---

`useFetch()` returns a [UsablePromise](https://react.dev/reference/react/use) thenable with denormalized data, error handling, and GC tracking. `use(useFetch(endpoint, args))` now behaves identically to `useSuspense(endpoint, args)` — suspending when data is loading, returning denormalized data when cached, throwing on errors, and re-suspending on invalidation.

Parallel fetches are supported since all `useFetch()` calls execute before any `use()` suspends:

```tsx
const postPromise = useFetch(PostResource.get, { id });
const commentsPromise = useFetch(CommentResource.getList, { postId: id });
const post = use(postPromise);
const comments = use(commentsPromise);
```
