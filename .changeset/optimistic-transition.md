---
'@data-client/react': patch
---

Stop optimistic updates from blocking the click that starts them

[DataProvider](https://dataclient.io/docs/api/DataProvider) now renders [optimistic updates](https://dataclient.io/rest/guides/optimistic-updates) in a [transition](https://react.dev/reference/react/startTransition) (React 18+). Before, a `controller.fetch()` from a click or submit handler re-rendered every component that reads the store before the browser could paint the click. Now the click paints first, and React renders the optimistic update in chunks that don't block input.

```tsx
<button onClick={() => ctrl.fetch(TodoResource.partialUpdate, { id }, { completed: true })}>
```

What you may notice:

- The optimistic update can show a frame or two later than before, still long before the server responds.
- A `setState` in the same handler, like a pending flag, now commits one render before the optimistic update.
- If the optimistic update makes a component suspend and no new `<Suspense>` boundary wraps it, React keeps the current UI until that data loads, instead of showing the fallback.
- [`controller.getState()`](https://dataclient.io/docs/api/Controller#getState) returns committed state, so a second handler that runs before that render does not see the optimistic update yet.

`controller.fetch()` itself is unchanged, and so are tests that use `act()`. The redux `DataProvider` from `@data-client/react/redux` still renders optimistic updates at the handler's priority.
