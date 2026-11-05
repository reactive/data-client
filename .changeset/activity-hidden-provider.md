---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
'@data-client/test': patch
'@data-client/use-enhanced-reducer': patch
---

Fix [DataProvider](https://dataclient.io/docs/api/DataProvider) losing work while React [`<Activity>`](https://react.dev/reference/react/Activity) hides it

Hiding a `DataProvider` in `<Activity mode="hidden">` (a tab or keep-alive route) runs its Effect cleanup, which the store treated like an unmount. A response that landed while hidden was dropped, so [useSuspense()](https://dataclient.io/docs/api/useSuspense) could stay suspended forever and an optimistic update never settled. `controller.fetch()` while hidden never resolved, and [useSubscription()](https://dataclient.io/docs/api/useSubscription) stopped polling for good once the provider was shown again.

Now a hidden `DataProvider` keeps its store working: responses and other updates apply while hidden, and promises waiting on them resolve once it is shown. Before, `<Activity>` had to go inside `DataProvider`; now either order works.

```tsx
<Activity mode={tab === 'posts' ? 'visible' : 'hidden'}>
  <DataProvider>
    <Posts />
  </DataProvider>
</Activity>
```

A `DataProvider` remounted with the same `managers` also no longer waits on a request the unmounted one started, and responses for the unmounted one stay out of the new store.

A response to a request started before [`resetEntireStore()`](https://dataclient.io/docs/api/Controller#resetEntireStore) is now always dropped, even when it lands before the reset commits. Custom managers that call `controller.resolve()` should pass a `fetchedAt` from after the last reset.

On React 18 and later, an action dispatched after a `DataProvider` really unmounts now reaches its managers, and React ignores the update. Its promise no longer resolves, so don't `await` controller calls after unmount. React 16 and 17 still drop these actions.

[`NetworkManager.cleanupDate`](https://dataclient.io/docs/api/NetworkManager) is deprecated: nothing reads it now. Delete code that reads or sets it.
