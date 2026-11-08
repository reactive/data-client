---
'@data-client/react': patch
---

Optimistic updates no longer block the click that starts them

[DataProvider](https://dataclient.io/docs/api/DataProvider) now renders [optimistic updates](https://dataclient.io/rest/guides/optimistic-updates) in a [transition](https://react.dev/reference/react/startTransition) (React 18+). Before, a `controller.fetch()` from a click or submit handler re-rendered every component that reads the store before the browser could paint the click. Now the click paints first, and React renders the optimistic update in chunks that don't block input.

```tsx
<button onClick={() => ctrl.fetch(TodoResource.partialUpdate, { id }, { completed: true })}>
```

The optimistic update can show a frame or two later than before, still long before the server responds. `controller.fetch()` itself is unchanged, and so are tests that use `act()`.
