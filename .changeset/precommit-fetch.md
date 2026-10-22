---
'@data-client/react': patch
---

Fix Suspense staying on the fallback when a fetch resolves before DataProvider mounts on React Native

[useSuspense](/docs/api/useSuspense) and `use(useFetch())` could stay on the fallback, or refetch in a loop, when their fetch finished before [DataProvider](/docs/api/DataProvider) had mounted. This happens when the provider sits inside a lazy-loaded layout, as with Expo Router, or when something outside the provider suspends during the first render.

On React Native, DataProvider now adds `CommitGateManager` first to its managers, which holds those results until the provider mounts. On web, add it before the other managers when a provider can render inside a lazy layout or next to a suspending sibling:

```tsx
<DataProvider managers={[new CommitGateManager(), ...getDefaultManagers()]}>
```
