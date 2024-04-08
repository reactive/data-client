---
"@data-client/normalizr": minor
"@data-client/endpoint": minor
"@data-client/react": minor
"@data-client/core": minor
---

BREAKING: Schema.infer -> Schema.queryKey

```ts title="Before"
class MyEntity extends Entity {
  // highlight-next-line
  static infer(
    args: readonly any[],
    indexes: NormalizedIndex,
    recurse: any,
    entities: any,
  ): any {
    if (SILLYCONDITION) return undefined;
    return super.infer(args, indexes, recurse, entities);
  }
}
```

```ts title="After"
class MyEntity extends Entity {
  // highlight-next-line
  static queryKey(
    args: readonly any[],
    queryKey: (...args: any) => any,
    getEntity: GetEntity,
    getIndex: GetIndex,
  ): any {
    if (SILLYCONDITION) return undefined;
    return super.queryKey(args, queryKey, getEntity, getIndex);
  }
}
```
