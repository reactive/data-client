---
'@data-client/normalizr': minor
'@data-client/endpoint': minor
'@data-client/graphql': minor
'@data-client/rest': minor
'@data-client/react': patch
'@data-client/core': patch
---

Change Schema.normalize interface from direct data access, to using functions like `getEntity`

```ts
interface SchemaSimple {
  normalize(
    input: any,
    parent: any,
    key: any,
    args: any[],
    visit: (schema: any, value: any, parent: any, key: any, args: readonly any[]) => any,
    addEntity: (...args: any) => any,
    getEntity: (...args: any) => any,
    checkLoop: (...args: any) => any,
  ): any;
}
```

We also add `checkLoop()`, which moves some logic in [Entity](https://dataclient.io/rest/api/Entity)
to the core normalize algorithm.

```ts
/** Returns true if a circular reference is found */
export interface CheckLoop {
  (entityKey: string, pk: string, input: object): boolean;
}
```