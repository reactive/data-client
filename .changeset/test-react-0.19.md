---
'@data-client/test': minor
---

BREAKING: `@data-client/test` requires `@data-client/react` 0.19

Support for `@data-client/react` 0.12 through 0.18 is dropped. Upgrade `@data-client/react` along with
`@data-client/test`.

```diff title="package.json"
- "@data-client/react": "^0.18.0",
+ "@data-client/react": "^0.19.0",
```

[makeRenderDataHook()](https://dataclient.io/docs/api/makeRenderDataHook) now passes `managers` to its Provider as a
function, so each render gets its own Managers. A custom Provider must accept `managers: () => Manager[]`, as
`DataProvider` does.
