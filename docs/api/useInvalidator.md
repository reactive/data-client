---
title: useInvalidator()
---

<!--DOCUSAURUS_CODE_TABS-->
<!--Type-->

```typescript
function useInvalidator(
  endpoint: ReadEndpoint,
): (params: object | null) => void;
```

<!--With Generics-->

```typescript
function useInvalidator<Params extends Readonly<object>, S extends Schema>(
  endpoint: ReadEndpoint<(p:Params) => Promise<any>, S>,
): (params: Params | null) => void;
```

<!--END_DOCUSAURUS_CODE_TABS-->

Mostly useful for imperatively invalidating the cache, with a similar signature to
[useFetcher](./useFetcher.md).

Sending a `null` to params results in a no-op.

Forces refetching and suspense on [useResource](./useResource.md) with the same Endpoint
and parameters.

## Example

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

## Invalidate an entity

`useInvalidator()` invalidates a particular response. If you're looking to invalidate *every*
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
  const invalidateAllWithArticle = useFetcher(ArticleResource.detail());

  return (
    <div>
      <h1>{article.title}<h1>
      <button onClick={() => invalidateAllWithArticle({ id })}>Fetch &amp; suspend</button>
    </div>
  );
}
```


## Internals

- set expiresAt to 0.
  - This triggers useRetrieve.
- deletes results entry.
  - This only allows direct read from the cache if inferred results.
- sets meta.invalidated to true.
  - This is used to determine whether to throw promise
