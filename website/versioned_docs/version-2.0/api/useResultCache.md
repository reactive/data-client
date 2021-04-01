---
title: useResultCache()
id: version-2.0-useResultCache
original_id: useResultCache
---
```typescript
function useResultCache<Params extends Readonly<object>, D extends object>(
  { getFetchKey, fetch }: ReadShape<any, Params, any>,
  params: Params | null,
  defaults?: D
): D extends undefined
  ? Resolved<ReturnType<typeof fetch>> | null
  : Readonly<D>;
```

Excellent to use with [pagination](../guides/pagination.md) or any other extra (non-entity) data in results.

* [On Error (404, 500, etc)](https://www.restapitutorial.com/httpstatuscodes.html):
  * Returns previously cached if exists
  * `defaults` if provided
  * null otherwise
* While loading:
  * Returns previously cached if exists
  * `defaults` if provided
  * null otherwise

## Example

By sending defaults we can destructure the values even if the results don't exist.

```tsx
function PostList() {
  const { prevPage, nextPage } = useResultCache(
    PaginatedResource.listShape(),
    {},
    { prevPage: '', nextPage: '' }
  );
  // ...render stuff here
}
```

## Useful `FetchShape`s to send

[Resource](./Resource.md#provided-and-overridable-methods) provides these built-in:

- listShape()

Feel free to add your own [FetchShape](./FetchShape.md) as well.
