---
'@data-client/normalizr': patch
'@data-client/endpoint': patch
'@data-client/react': patch
'@data-client/core': patch
'@data-client/rest': patch
'@data-client/graphql': patch
---

Normalize delegate.invalidate() first argument only has `key` param.

`indexes` optional param no longer provided as it was never used.


```ts
normalize(
  input: any,
  parent: any,
  key: string | undefined,
  args: any[],
  visit: (...args: any) => any,
  delegate: INormalizeDelegate,
): string {
  delegate.invalidate({ key: this._entity.key }, pk);
  return pk;
}
```