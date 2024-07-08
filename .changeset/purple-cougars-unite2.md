---
'@data-client/normalizr': minor
'@data-client/endpoint': minor
'@data-client/graphql': minor
'@data-client/rest': minor
'@data-client/react': patch
'@data-client/core': patch
---

Change Schema.denormalize `unvisit` to have [schema](https://dataclient.io/rest/api/schema) argument first.

```ts
interface SchemaSimple {
  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): T;
}
```



