---
'@data-client/normalizr': minor
'@data-client/endpoint': minor
'@data-client/rest': minor
'@data-client/graphql': minor
---

Add delegate.invalidate() to normalization

#### Before

```ts
normalize(
  input: any,
  parent: any,
  key: string | undefined,
  args: any[],
  visit: (...args: any) => any,
  delegate: INormalizeDelegate,
): string {
  delegate.setEntity(this as any, pk, INVALID);
}
```

#### After

```ts
normalize(
  input: any,
  parent: any,
  key: string | undefined,
  args: any[],
  visit: (...args: any) => any,
  delegate: INormalizeDelegate,
): string {
  delegate.invalidate(this as any, pk);
}
```