---
title: useInvalidator()
---

<!--DOCUSAURUS_CODE_TABS-->
<!--Type-->

```typescript
function useInvalidator(
  fetchShape: ReadShape,
): (params: object | null) => void;
```

<!--With Generics-->

```typescript
function useInvalidator<Params extends Readonly<object>, S extends Schema>(
  fetchShape: ReadShape<S, Params>,
): (params: Params | null) => void;
```

<!--END_DOCUSAURUS_CODE_TABS-->

Mostly useful for imperatively invalidating the cache, with a similar signature to
[useFetcher](./useFetcher.md).

Sending a `null` to params results in a no-op.

Forces refetching and suspense on [useResource](./useResource.md) with the same FetchShape
and parameters.

## Example

```tsx
function ArticleName({ id }: { id: string }) {
  const article = useResource(ArticleResource.detailShape(), { id });
  const invalidateArticle = useInvalidator(ArticleResource.detailShape());

  return (
    <div>
      <h1>{article.title}<h1>
      <button onClick={() => invalidateArticle({ id })}>Fetch &amp; suspend</button>
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
