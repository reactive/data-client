---
title: useRetrieve()
id: useRetrieve
original_id: useRetrieve
---

<!--DOCUSAURUS_CODE_TABS-->
<!--Type-->

```typescript
function useRetrieve(
  fetchShape: ReadShape,
  params: object | null,
): Promise<any> | undefined;
```

<!--With Generics-->

```typescript
function useRetrieve<
  Params extends Readonly<object>,
  S extends Schema
>(
  fetchShape: ReadShape<S, Params>,
  params: Params | null,
): Promise<any> | undefined;
```

<!--END_DOCUSAURUS_CODE_TABS-->

Great for retrieving resources optimistically before they are needed.

This can be useful for ensuring resources early in a render tree before they are needed.

- Triggers fetch:
  - On first-render
    - or parameters change
    - or required entity is deleted
    - or imperative [invalidation](./useInvalidator) triggered
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
