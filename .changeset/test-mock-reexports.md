---
'@data-client/test': minor
---

BREAKING: `@data-client/test` requires `@data-client/react` 0.15 or later

Support for `@data-client/react` 0.12 through 0.14 is dropped, since `@data-client/test` imports
`@data-client/react/mock`, which first shipped in 0.15. Upgrade `@data-client/react` along with `@data-client/test`.

```diff title="package.json"
- "@data-client/react": "^0.14.0",
+ "@data-client/react": "^0.19.0",
```

`Fixture`, `Interceptor`, and the other fixture types from `@data-client/test` are now the same types that
`@data-client/react/mock` exports, so fixtures typed with either import work everywhere.
