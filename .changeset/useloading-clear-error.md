---
'@data-client/react': patch
---

Fix [useLoading()](https://dataclient.io/docs/api/useLoading) keeping the last error after a later call succeeds

Before, once the wrapped function rejected, `error` stayed set for good, so a form showed its old error message even after the next submit worked. Now `error` is cleared each time the wrapped function is called, matching Vue's `useLoading()`.

When calls overlap, `loading` and `error` now follow the latest call. Before, an earlier call that settled later could set `error` after the latest call succeeded, or set `loading` to `false` while the latest call was still pending.

```tsx
const [handleSubmit, loading, error] = useLoading(
  data => ctrl.fetch(PostResource.update, { id }, data),
  [ctrl, id],
);
// submit fails: error is set
// submit again: error is undefined while it runs, and stays undefined if it succeeds
```
