---
'@data-client/react': patch
---

The "Uncaught suspense" warning now says to put Suspense boundaries inside [DataProvider](https://dataclient.io/docs/api/DataProvider)

A `<Suspense>` above `DataProvider` never catches its children, because `DataProvider` has its own backup boundary.

```tsx
<DataProvider>
  <AsyncBoundary fallback={<Loading />}>
    <App />
  </AsyncBoundary>
</DataProvider>
```
