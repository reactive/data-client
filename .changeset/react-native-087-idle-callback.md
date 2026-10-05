---
'@data-client/react': patch
---

Fix React Native 0.87 support

React Native 0.87 removed `InteractionManager`, so using `@data-client/react` there threw
"InteractionManager has been removed from react-native core" in development. Low-priority work now runs through
`requestIdleCallback`: refetches when a screen regains focus in [useSuspense()](https://dataclient.io/docs/api/useSuspense),
[useFetch()](https://dataclient.io/docs/api/useFetch) and [useDLE()](https://dataclient.io/docs/api/useDLE),
sweeps by `GCPolicy`, and fetches by
[IdlingNetworkManager](https://dataclient.io/docs/api/getDefaultManagers#manager-inheritance). This works on every
supported React Native version.
