---
'@data-client/rest': patch
---

Fix RestEndpoint subclass constructor inference when path widens to `string`

When subclassing `RestEndpoint` with `O extends RestGenerics = any`, TypeScript
could widen path literals to `string`, producing restrictive union overloads that
broke `getOptimisticResponse`, `key`, `url`, and `process` callbacks.

`RestEndpointConstructorOptions` now uses `SoftPathArgs` for the explicit
`searchParams: undefined` case as well, matching other branches (previously it
still used `PathArgs`, which kept the `PathArgs<string>` index-signature problem).

