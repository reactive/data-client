---
'@data-client/react': patch
---

Add `CommitGateManager` for DataProvider inside a lazy layout, such as Expo Router's root layout

[useSuspense](/docs/api/useSuspense) and `use(useFetch())` could stay on the fallback, or refetch in a loop, when their fetch finished before [DataProvider](/docs/api/DataProvider) had mounted. Expo Router wraps routes, including the root `_layout.tsx`, in `React.lazy` when async routes are on (the default on web), so React can throw away the provider's first render. Any DataProvider inside `React.lazy`, or next to something that suspends outside it, is affected. This is not specific to React Native.

Add `CommitGateManager` before the other managers. It holds those results until the provider mounts:

```tsx
<DataProvider managers={[new CommitGateManager(), ...getDefaultManagers()]}>
```

On React Native, DataProvider adds it automatically.
