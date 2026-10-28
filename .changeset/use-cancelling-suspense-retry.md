---
'@data-client/react': patch
---

Fix [useCancelling()](https://dataclient.io/docs/api/useCancelling) aborting its own fetch, so the component can stay suspended forever

When params changed and the component suspended, any re-render while it waited (a parent update, another fetch landing in the store) aborted the request it was waiting on and started another. When requests were slow, the new data could never arrive. Now each params change cancels only the previous request.

```tsx
// switching messages while the last one is still loading now shows the new one
const message = useSuspense(useCancelling(MessageResource.get, { id }), {
  id,
});
```
