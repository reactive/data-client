# useResultCache()

```typescript
function useResultCache<Params extends Readonly<object>, D extends object>(
  { getUrl, fetch }: ReadShape<any, Params, any>,
  params: Params | null,
  defaults?: D
): D extends undefined
  ? Resolved<ReturnType<typeof fetch>> | null
  : Readonly<D>;
```

Excellent to use with [pagination](../guides/pagination.md) or any other extra (non-entity) data in results.

Because of this it will not block rendering and instead return null
if the desired data is not found.

## Example

By sending defaults we can destructure the values even if the results don't exist.

```tsx
function PostList() {
  const { prevPage, nextPage } = useResultCache(
    PaginatedResource.listRequest(),
    {},
    { prevPage: '', nextPage: '' }
  );
  // ...render stuff here
}
```

## Useful `RequestShape`s to send

[Resource](./Resource.md#provided-and-overridable-methods) provides these built-in:

- listRequest()

Feel free to add your own [RequestShape](./RequestShape.md) as well.
