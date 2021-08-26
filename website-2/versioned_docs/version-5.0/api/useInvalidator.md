---
title: useInvalidator()
---
import GenericsTabs from '@site/src/components/GenericsTabs';

<GenericsTabs>

```typescript
function useInvalidator(
  endpoint: ReadEndpoint,
): (params: object | null) => void;
```

```typescript
function useInvalidator<Params extends Readonly<object>, S extends Schema>(
  endpoint: ReadEndpoint<(p: Params) => Promise<any>, S>,
): (params: Params | null) => void;
```

</GenericsTabs>

Mostly useful for imperatively invalidating the cache, with a similar signature to
[useFetcher](./useFetcher.md).

Sending a `null` to params results in a no-op.

> Forces refetching and suspense on [useResource](./useResource.md) with the same Endpoint
> and parameters.
>
> To refresh while continuing to display stale data - [useFetcher](./useFetcher.md) instead.

### Example

```tsx
function ArticleName({ id }: { id: string }) {
  const article = useResource(ArticleResource.detail(), { id });
  const invalidateArticle = useInvalidator(ArticleResource.detail());

  return (
    <div>
      <h1>{article.title}<h1>
      <button onClick={() => invalidateArticle({ id })}>Fetch &amp; suspend</button>
    </div>
  );
}
```

### Internals

- set expiresAt to 0.
  - This triggers useRetrieve.
- deletes results entry.
  - This only allows direct read from the cache if inferred results.
- sets meta.invalidated to true.
  - This is used to determine whether to throw promise (trigger suspense)

## Invalidate an entity

`useInvalidator()` invalidates a particular response. If you're looking to invalidate _every_
response containing a particular entity, use the [Delete](./Delete)
Schema. This causes all responses with that entity marked as required to suspend.

In case this isn't an actual endpoint, simply fake the `fetch`:

```tsx
const InvalidateArticle = new Endpoint(
  (params) => Promise.resolve(params),
  { schema: new schemas.Delete(ArticleResource) }
);

function ArticleName({ id }: { id: string }) {
  const article = useResource(ArticleResource.detail(), { id });
  const invalidateAllWithArticle = useFetcher(InvalidateArticle);

  return (
    <div>
      <h1>{article.title}<h1>
      <button onClick={() => invalidateAllWithArticle({ id })}>Fetch &amp; suspend</button>
    </div>
  );
}
```

The fetch should resolve to an object that can compute the `pk()` (like 'id')
of the entity. This is needed so Rest Hooks knows which entity is being deleted.

If the actual server response does not include this information, typically
you can pass through relevant information from the params themselves.

```tsx
const InvalidateArticle = new Endpoint(
  ({ id }) => {
    // disregard response from API since it's just an empty string
    await fetch(`/article/${id}`, { method: 'DELETE' });
    return { id };
  },
  { schema: new schemas.Delete(ArticleResource) },
);
```

This is actually what the default [Resource.delete()](./resource#delete-endpoint) does.
