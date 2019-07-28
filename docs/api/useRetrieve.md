---
title: useRetrieve()
---

<!--DOCUSAURUS_CODE_TABS-->
<!--Type-->

```typescript
function useRetrieve(
  fetchShape: ReadShape,
  params: Readonly<object> | null,
  body?: Readonly<object> | void,
): Promise<any> | undefined;
```

<!--With Generics-->

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

<!--END_DOCUSAURUS_CODE_TABS-->

Great for retrieving resources optimistically before they are needed.

Will return a Promise if the resource is not yet in cache, otherwise undefined.

This can be useful for ensuring resources early in a render tree before they are needed.

Network errors will result in the promise rejecting.

## Example

Using a type guard to deal with null

```tsx
function MasterPost({ id }: { id: number }) {
  useRetrieve(PostResource.detailShape(), { id });
  // ...
}
```

## Useful `FetchShape`s to send

[Resource](./Resource.md#provided-and-overridable-methods) provides these built-in:

- detailShape()
- listShape()

Feel free to add your own [FetchShape](./FetchShape.md) as well.
