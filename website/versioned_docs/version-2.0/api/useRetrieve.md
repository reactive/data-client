---
title: useRetrieve()
id: version-2.0-useRetrieve
original_id: useRetrieve
---
```typescript
function useRetrieve<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
>(
  fetchShape: ReadShape<S, Params, Body>,
  params: Params | null,
  body?: Body,
): Promise<any> | undefined;
```

Great for retrieving resources optimistically before they are needed.

This can be useful for ensuring resources early in a render tree before they are needed.

- Triggers fetch:
  - On first-render and when parameters change
  - and When not in cache or result is considered stale
  - and When no identical requests are in flight
  - and when params are not null
- [On Error (404, 500, etc)](https://www.restapitutorial.com/httpstatuscodes.html):
  - Returned promise will reject
- On fetch returns a promise else undefined.

## Example

### Simple

```tsx
function MasterPost({ id }: { id: number }) {
  useRetrieve(PostResource.detailShape(), { id });
  // ...
}
```

### Conditional

```tsx
function MasterPost({ id, doNotFetch }: { id: number, doNotFetch: boolean }) {
  useRetrieve(PostResource.detailShape(), doNotFetch ? null : { id });
  // ...
}
```

## Useful `FetchShape`s to send

[Resource](./Resource.md#provided-and-overridable-methods) provides these built-in:

- detailShape()
- listShape()

Feel free to add your own [FetchShape](./FetchShape.md) as well.
