---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
'@data-client/test': patch
'@data-client/use-enhanced-reducer': patch
---

Support React [`<Activity>`](https://react.dev/reference/react/Activity) above [DataProvider](https://dataclient.io/docs/api/DataProvider)

```tsx
<Activity mode={tab === 'posts' ? 'visible' : 'hidden'}>
  <DataProvider>
    <Posts />
  </DataProvider>
</Activity>
```

Most apps should still put `DataProvider` at the root, above everything, including `<Activity>`. That still works as before.

Before, hiding a `DataProvider` dropped responses, so [useSuspense()](https://dataclient.io/docs/api/useSuspense) could stay suspended forever, optimistic updates never settled, `controller.fetch()` never resolved, and [useSubscription()](https://dataclient.io/docs/api/useSubscription) stopped polling for good. Now a hidden `DataProvider` keeps working, and promises resolve once it is shown.

A `DataProvider` remounted with the same `managers` also no longer waits on a request the unmounted one started, and responses for the unmounted one stay out of the new store.

A response to a request started before [`resetEntireStore()`](https://dataclient.io/docs/api/Controller#resetEntireStore) is now always dropped, even when it lands before the reset commits. A response also no longer settles an in-flight request for the same key that has a later `fetchedAt`; that request waits for its own response. Custom managers that call [`controller.resolve()`](https://dataclient.io/docs/api/Controller#resolve) should pass the `fetchedAt` of the fetch action they are resolving (`action.meta.fetchedAt`).
