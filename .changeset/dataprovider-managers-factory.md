---
'@data-client/react': minor
---

Add `managers` factory support to `DataProvider`; arrays are now transitional

`managers` accepts a function that creates the managers. It is called once when the provider
mounts, so the same definition works for the Next.js provider (which only accepts a function) and
each `DataProvider` on a page gets its own instances instead of sharing one hoisted array.

```tsx
// Before:
const managers = [...getDefaultManagers(), new MyManager()];
// After:
const managers = () => [...getDefaultManagers(), new MyManager()];

<DataProvider managers={managers}>
  <App />
</DataProvider>;
```

Passing an array still works, but the function form is the long-term API and arrays will be
removed in a future release. Migrate when you can.
